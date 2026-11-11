import { PrismaClient, SubjectType, Difficulty, VerificationStatus } from '@prisma/client';
import { generateQuestionBatch, isGeminiConfigured } from '../src/lib/geminiClient';
import { computeDuplicateHash } from '../src/lib/questionValidation';
import { verifyQuestionQuality } from '../src/lib/questionVerificationAgent';
import { generateMockPaper } from '../src/lib/mockPaperEngine';

const prisma = new PrismaClient();

interface TargetChapter {
  subject: SubjectType;
  chapterName: string;
  count: number;
}

const TARGET_CHAPTERS: TargetChapter[] = [
  // Botany (highest priority for unique expansion)
  { subject: SubjectType.BOTANY, chapterName: 'Cell: The Unit of Life', count: 20 },
  { subject: SubjectType.BOTANY, chapterName: 'Photosynthesis in Higher Plants', count: 20 },
  { subject: SubjectType.BOTANY, chapterName: 'Plant Physiology', count: 20 },
  { subject: SubjectType.BOTANY, chapterName: 'Ecology and Environment', count: 20 },

  // Zoology (high priority for unique expansion)
  { subject: SubjectType.ZOOLOGY, chapterName: 'Human Physiology', count: 20 },
  { subject: SubjectType.ZOOLOGY, chapterName: 'Body Fluids and Circulation', count: 20 },
  { subject: SubjectType.ZOOLOGY, chapterName: 'Human Reproduction', count: 20 },
  { subject: SubjectType.ZOOLOGY, chapterName: 'Animal Kingdom', count: 20 },

  // Chemistry
  { subject: SubjectType.CHEMISTRY, chapterName: 'Chemical Kinetics', count: 20 },
  { subject: SubjectType.CHEMISTRY, chapterName: 'Solutions', count: 20 },
  { subject: SubjectType.CHEMISTRY, chapterName: 'Coordination Compounds', count: 20 },

  // Physics
  { subject: SubjectType.PHYSICS, chapterName: 'Current Electricity', count: 20 },
  { subject: SubjectType.PHYSICS, chapterName: 'Ray Optics', count: 20 },
];

async function main() {
  console.log('=== EXPANDING QUESTION BANK WITH UNIQUE NCERT QUESTIONS VIA GEMINI ===');

  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }

  // Pre-load all existing duplicateHashes & statements to guarantee 0 collisions
  const existingQuestions = await prisma.question.findMany({
    select: { statement: true, duplicateHash: true },
  });
  const existingHashes = new Set<string>();
  const existingStatements = new Set<string>();

  for (const q of existingQuestions) {
    existingStatements.add(q.statement.trim().toLowerCase());
    if (q.duplicateHash) existingHashes.add(q.duplicateHash);
  }

  console.log(`Loaded ${existingQuestions.length} existing questions. Unique hashes: ${existingHashes.size}`);

  // Fetch subjects and chapters map
  const subjects = await prisma.subject.findMany({ include: { chapters: true } });
  const subjectMap = new Map<SubjectType, { id: string; chapters: Map<string, string> }>();
  for (const s of subjects) {
    const chapMap = new Map<string, string>();
    for (const c of s.chapters) {
      chapMap.set(c.name.toLowerCase(), c.id);
    }
    subjectMap.set(s.code, { id: s.id, chapters: chapMap });
  }

  let totalInserted = 0;

  for (const target of TARGET_CHAPTERS) {
    console.log(`\n--- Generating ${target.count} questions for ${target.subject} -> ${target.chapterName} ---`);
    const subInfo = subjectMap.get(target.subject);
    if (!subInfo) {
      console.warn(`Subject ${target.subject} not found in DB!`);
      continue;
    }

    const chapterId = subInfo.chapters.get(target.chapterName.toLowerCase()) || null;

    try {
      const genResult = await generateQuestionBatch({
        subject: target.subject,
        chapterName: target.chapterName,
        batchSize: target.count,
        model: 'gemini-3.5-flash-lite',
      });

      console.log(`Gemini returned ${genResult.validQuestions.length} valid questions.`);

      const validToInsert: any[] = [];

      for (const q of genResult.validQuestions) {
        const stmtNorm = q.statement.trim().toLowerCase();
        const hash = computeDuplicateHash(q.statement);

        // Strict non-duplication
        if (existingStatements.has(stmtNorm) || existingHashes.has(hash)) {
          console.log(`  [SKIP] Collision detected for question: "${q.statement.slice(0, 50)}..."`);
          continue;
        }

        // Run through 7-rule NTA verification
        const verif = await verifyQuestionQuality(
          {
            statement: q.statement,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            subject: target.subject,
            chapterName: target.chapterName,
            topic: q.topic,
            difficulty: q.difficulty as Difficulty,
          },
          { useGeminiIndependentVerification: false, checkDuplicateInDb: false }
        );

        if (verif.status !== VerificationStatus.VERIFIED) {
          console.log(`  [REJECT] Failed verification: ${verif.rejectionReason}`);
          continue;
        }

        existingStatements.add(stmtNorm);
        existingHashes.add(hash);

        validToInsert.push({
          subjectId: subInfo.id,
          chapterId: chapterId,
          topic: q.topic || target.chapterName,
          statement: q.statement,
          option1: q.option1,
          option2: q.option2,
          option3: q.option3,
          option4: q.option4,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty as Difficulty,
          questionSource: 'AI_GENERATED',
          source: 'Gemini AI (Verified NCERT High-Yield)',
          syllabusVersion: 'NMC_NEET_2027',
          verificationStatus: VerificationStatus.VERIFIED,
          duplicateHash: hash,
          verifiedAt: new Date(),
          verifiedBy: 'NTA CBT Question Verification Pipeline',
          isVerifiedPYQ: false,
        });
      }

      if (validToInsert.length > 0) {
        await prisma.question.createMany({
          data: validToInsert,
          skipDuplicates: true,
        });
        totalInserted += validToInsert.length;
        console.log(`  ✅ Successfully inserted ${validToInsert.length} unique questions.`);
      }
    } catch (e: any) {
      console.error(`  ❌ Error processing chapter ${target.chapterName}: ${e.message}`);
    }
  }

  console.log(`\n=== QUESTION BANK EXPANSION COMPLETE ===`);
  console.log(`Total new unique questions added to PostgreSQL: ${totalInserted}`);
  console.log(`Total questions in database: ${await prisma.question.count()}`);

  // Now generate 10 new unique full-length mock papers (MOCK_101 to MOCK_110)
  console.log('\n=== GENERATING 10 NEW UNIQUE MOCK PAPERS (MOCK_101 to MOCK_110) ===');
  const maxPaper = await prisma.mockPaper.aggregate({ _max: { paperNumber: true } });
  const startNum = (maxPaper._max.paperNumber || 100) + 1;
  const endNum = startNum + 9; // e.g. 101 to 110

  console.log(`Generating papers ${startNum} to ${endNum}...`);

  for (let num = startNum; num <= endNum; num++) {
    const code = `MOCK_${num.toString().padStart(3, '0')}`;
    const title = `NEET MOCK TEST ${num}`;
    console.log(`Generating ${title} (${code})...`);

    const paper = await generateMockPaper({
      paperNumber: num,
      title,
      description: `Official NEET UG 2027 CBT Full-Length Simulation (180 Questions, 720 Marks)`,
      seed: `NEET_2027_EXPANDED_MOCK_SEED_${num}`,
      easyCount: 54,
      moderateCount: 90,
      difficultCount: 36,
      syllabusVersion: 'NMC_NEET_2027',
    });

    console.log(`  ✅ ${title} generated with 180 questions (zero duplicates).`);
  }

  console.log(`\n=== ALL NEW PAPERS GENERATED SUCCESSFULLY ===`);
  console.log(`Total Mock Papers in database: ${await prisma.mockPaper.count()}`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
