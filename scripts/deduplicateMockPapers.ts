import { prisma } from '../src/lib/prisma';
import { seededShuffle, createPRNG } from '../src/lib/mockPaperEngine';
import { Difficulty, SubjectType } from '@prisma/client';

async function main() {
  console.log('=== STARTING HIGH-SPEED MOCK PAPER DEDUPLICATION ===');

  // Fetch all verified questions grouped by subject
  const allVerifiedQuestions = await prisma.question.findMany({
    where: { verificationStatus: 'VERIFIED' },
    select: {
      id: true,
      statement: true,
      duplicateHash: true,
      subjectId: true,
      difficulty: true,
      correctAnswer: true,
      subject: { select: { code: true } },
    },
  });

  console.log(`Loaded ${allVerifiedQuestions.length} verified questions from DB.`);

  // Group verified questions by subject code
  const poolBySubject: Record<string, typeof allVerifiedQuestions> = {
    PHYSICS: [],
    CHEMISTRY: [],
    BOTANY: [],
    ZOOLOGY: [],
  };

  for (const q of allVerifiedQuestions) {
    if (poolBySubject[q.subject.code]) {
      poolBySubject[q.subject.code].push(q);
    }
  }

  for (const [code, list] of Object.entries(poolBySubject)) {
    const uniqueStmts = new Set(list.map((q) => q.statement.trim().toLowerCase()));
    console.log(`Subject ${code}: ${list.length} rows, ${uniqueStmts.size} unique statements.`);
  }

  // Fetch all mock papers with their questions
  const papers = await prisma.mockPaper.findMany({
    orderBy: { paperNumber: 'asc' },
    include: {
      paperQuestions: {
        include: {
          question: true,
        },
        orderBy: { questionOrder: 'asc' },
      },
    },
  });

  console.log(`Processing ${papers.length} mock papers...`);

  let totalReplacements = 0;
  let papersUpdated = 0;

  for (const paper of papers) {
    const prng = createPRNG(`DEDUPE_${paper.code}_${paper.paperNumber}`);
    const paperStatements = new Set<string>();
    const paperHashes = new Set<string>();
    const paperQuestionIds = new Set<string>();

    const duplicatesToFix: typeof paper.paperQuestions = [];

    // First pass: identify duplicates within the paper
    for (const pq of paper.paperQuestions) {
      const stmt = pq.question.statement.trim().toLowerCase();
      const hash = pq.question.duplicateHash;
      const isDupe =
        paperStatements.has(stmt) ||
        (hash && paperHashes.has(hash)) ||
        paperQuestionIds.has(pq.questionId);

      if (isDupe) {
        duplicatesToFix.push(pq);
      } else {
        paperStatements.add(stmt);
        if (hash) paperHashes.add(hash);
        paperQuestionIds.add(pq.questionId);
      }
    }

    if (duplicatesToFix.length === 0) {
      continue;
    }

    papersUpdated++;

    // Prepare updates in memory
    const updatesToRun: Array<{
      id: string;
      data: {
        questionId: string;
        optionAMapping: number;
        optionBMapping: number;
        optionCMapping: number;
        optionDMapping: number;
        shuffledCorrectAnswer: number;
      };
    }> = [];

    for (const pq of duplicatesToFix) {
      const subCode = pq.subjectCode as SubjectType;
      const subPool = poolBySubject[subCode] || [];

      // Filter available candidates not yet used in this paper
      const availableCandidates = subPool.filter((candidate) => {
        const cStmt = candidate.statement.trim().toLowerCase();
        const cHash = candidate.duplicateHash;
        if (paperQuestionIds.has(candidate.id)) return false;
        if (paperStatements.has(cStmt)) return false;
        if (cHash && paperHashes.has(cHash)) return false;
        return true;
      });

      if (availableCandidates.length === 0) {
        console.error(`CRITICAL: No unique candidate available in subject ${subCode} for paper ${paper.code}!`);
        continue;
      }

      // Try to match difficulty
      let poolToPick = availableCandidates.filter((c) => c.difficulty === pq.question.difficulty);
      if (poolToPick.length === 0) {
        poolToPick = availableCandidates; // fallback to any difficulty in subject
      }

      // Pick deterministically using PRNG
      const shuffled = seededShuffle(poolToPick, prng);
      const chosen = shuffled[0];

      // Mark as used in this paper
      paperQuestionIds.add(chosen.id);
      paperStatements.add(chosen.statement.trim().toLowerCase());
      if (chosen.duplicateHash) paperHashes.add(chosen.duplicateHash);

      // Re-map options
      const originalOptions = [1, 2, 3, 4];
      const shuffledOptions = seededShuffle(originalOptions, prng);
      const shuffledCorrectIndex = shuffledOptions.indexOf(chosen.correctAnswer) + 1;

      updatesToRun.push({
        id: pq.id,
        data: {
          questionId: chosen.id,
          optionAMapping: shuffledOptions[0],
          optionBMapping: shuffledOptions[1],
          optionCMapping: shuffledOptions[2],
          optionDMapping: shuffledOptions[3],
          shuffledCorrectAnswer: shuffledCorrectIndex,
        },
      });
    }

    // Execute updates in parallel chunks of 15
    const CHUNK_SIZE = 15;
    for (let i = 0; i < updatesToRun.length; i += CHUNK_SIZE) {
      const chunk = updatesToRun.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((u) =>
          prisma.mockPaperQuestion.update({
            where: { id: u.id },
            data: u.data,
          })
        )
      );
    }

    totalReplacements += updatesToRun.length;
    console.log(`[DONE] Paper ${paper.code} (#${paper.paperNumber}): replaced ${updatesToRun.length} duplicate questions.`);
  }

  console.log(`\n=== MOCK PAPER DEDUPLICATION COMPLETE ===`);
  console.log(`Papers updated: ${papersUpdated} / ${papers.length}`);
  console.log(`Total duplicate questions replaced: ${totalReplacements}`);
}

main()
  .catch((err) => {
    console.error('Error running deduplication:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
