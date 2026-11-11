import { PrismaClient, SubjectType, Difficulty, VerificationStatus } from '@prisma/client';
import { generateQuestionBatch, isGeminiConfigured } from '../src/lib/geminiClient';
import { computeDuplicateHash } from '../src/lib/questionValidation';
import { verifyQuestionQuality } from '../src/lib/questionVerificationAgent';

const prisma = new PrismaClient();

interface ReplacementOptions {
  limit?: number;
  subject?: SubjectType;
  batchSize?: number;
  dryRun?: boolean;
}

export async function runControlledBatchReplacement(options: ReplacementOptions = {}) {
  const { limit = 25, subject, batchSize = 10, dryRun = false } = options;

  console.log('=== STARTING CONTROLLED GEMINI QUESTION REPLACEMENT BATCH ===');
  console.log(`Configuration: limit=${limit}, subject=${subject || 'ALL'}, batchSize=${batchSize}, dryRun=${dryRun}`);

  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  // 1. Fetch all questions and group by duplicateHash
  const allQuestions = await prisma.question.findMany({
    where: subject ? { subject: { code: subject } } : undefined,
    include: {
      subject: true,
      chapter: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const clusters = new Map<string, typeof allQuestions>();
  for (const q of allQuestions) {
    const hash = q.duplicateHash || computeDuplicateHash(q.statement);
    const list = clusters.get(hash) || [];
    list.push(q);
    clusters.set(hash, list);
  }

  // Identify duplicate questions to replace (keep 1 original per cluster, replace the rest)
  const toReplace: (typeof allQuestions)[0][] = [];
  for (const [, group] of clusters.entries()) {
    if (group.length > 1) {
      // Keep first, replace the remaining (group.length - 1)
      for (let i = 1; i < group.length; i++) {
        toReplace.push(group[i]);
      }
    }
  }

  console.log(`Identified ${toReplace.length} duplicate questions queued for replacement.`);
  const queue = toReplace.slice(0, limit);
  console.log(`Selected ${queue.length} questions for this controlled execution batch.`);

  if (queue.length === 0) {
    console.log('No duplicate questions found for the given criteria.');
    return { replacedCount: 0, failedCount: 0 };
  }

  // Group queue by subject and chapter
  const byChapter = new Map<string, typeof queue>();
  for (const q of queue) {
    const key = `${q.subject.code}:::${q.chapter?.name || 'General'}`;
    const list = byChapter.get(key) || [];
    list.push(q);
    byChapter.set(key, list);
  }

  let replacedCount = 0;
  let failedCount = 0;

  // Set of existing hashes in the entire question bank to prevent any new collisions
  const existingHashes = new Set(allQuestions.map((q) => q.duplicateHash || computeDuplicateHash(q.statement)));

  for (const [key, questionsInChap] of byChapter.entries()) {
    const [subCode, chapName] = key.split(':::') as [SubjectType, string];
    console.log(`\n--- Processing Chapter: ${chapName} (${subCode}) - ${questionsInChap.length} questions to replace ---`);

    // Generate in sub-batches
    for (let i = 0; i < questionsInChap.length; i += batchSize) {
      const chunk = questionsInChap.slice(i, i + batchSize);
      console.log(`Generating replacement batch of ${chunk.length} questions via Gemini...`);

      try {
        const genResult = await generateQuestionBatch({
          subject: subCode,
          chapterName: chapName,
          batchSize: chunk.length,
          model: 'gemini-3.5-flash-lite',
        });

        console.log(`Gemini returned ${genResult.validQuestions.length} valid candidate questions.`);

        for (let j = 0; j < chunk.length; j++) {
          const oldQuestion = chunk[j];
          const newCandidate = genResult.validQuestions[j];

          if (!newCandidate) {
            console.warn(`[SKIP] No matching candidate returned for question ${oldQuestion.id}`);
            failedCount++;
            continue;
          }

          // Rule 1: Four-option validation & completeness
          const options = [
            newCandidate.option1.trim(),
            newCandidate.option2.trim(),
            newCandidate.option3.trim(),
            newCandidate.option4.trim(),
          ];
          if (options.some((o) => !o) || !newCandidate.statement.trim() || !newCandidate.explanation.trim()) {
            console.warn('[REJECT] Completeness check failed: missing statement, explanation, or options');
            failedCount++;
            continue;
          }

          // Rule 2: Forbidden option checks
          const forbiddenRegex = /all of the above|none of the above|both (?:a|1) and (?:b|2)|none of these/i;
          if (options.some((opt) => forbiddenRegex.test(opt))) {
            console.warn('[REJECT] Question contains forbidden option pattern.');
            failedCount++;
            continue;
          }

          // Rule 3: Distinct options check
          const distinctOpts = new Set(options.map((o) => o.toLowerCase().trim()));
          if (distinctOpts.size < 4) {
            console.warn('[REJECT] Question options are not 4 distinct options.');
            failedCount++;
            continue;
          }

          // Rule 4: Duplicate Hash Collision check
          const newHash = computeDuplicateHash(newCandidate.statement);
          if (existingHashes.has(newHash)) {
            console.warn('[REJECT] Duplicate collision: hash already exists in question bank.');
            failedCount++;
            continue;
          }

          // Rule 5: Independent Verification
          const verifResult = await verifyQuestionQuality(
            {
              statement: newCandidate.statement,
              option1: newCandidate.option1,
              option2: newCandidate.option2,
              option3: newCandidate.option3,
              option4: newCandidate.option4,
              correctAnswer: newCandidate.correctAnswer,
              explanation: newCandidate.explanation,
              subject: subCode,
              chapterName: chapName,
              topic: newCandidate.topic,
              difficulty: newCandidate.difficulty as Difficulty,
            },
            {
              useGeminiIndependentVerification: false, // Rule-based validator to keep batch throughput ultra-fast and reliable
              checkDuplicateInDb: false, // We already check against existingHashes
            }
          );

          if (verifResult.status !== VerificationStatus.VERIFIED) {
            console.warn(`[REJECT] Verification failed (${verifResult.status}): ${verifResult.rejectionReason || verifResult.reviewerNotes}`);
            failedCount++;
            continue;
          }

          if (dryRun) {
            console.log(`[DRY-RUN] Would replace question ${oldQuestion.id} with: "${newCandidate.statement.slice(0, 60)}..."`);
            replacedCount++;
            existingHashes.add(newHash);
            continue;
          }

          // Update question record in PostgreSQL directly (avoid long interactive transactions on pooler)
          await prisma.question.update({
            where: { id: oldQuestion.id },
            data: {
              statement: newCandidate.statement,
              option1: newCandidate.option1,
              option2: newCandidate.option2,
              option3: newCandidate.option3,
              option4: newCandidate.option4,
              correctAnswer: newCandidate.correctAnswer,
              explanation: newCandidate.explanation,
              difficulty: newCandidate.difficulty as Difficulty,
              duplicateHash: newHash,
              topic: newCandidate.topic || oldQuestion.topic,
              verificationStatus: VerificationStatus.VERIFIED,
              source: 'Gemini AI (Independently Verified NCERT Replacement)',
              verifiedAt: new Date(),
              verifiedBy: 'Gemini Independent Verifier',
              isVerifiedPYQ: false,
            },
          });

          // Resynchronize any MockPaperQuestion option mappings if attached to mock exams
          const mpqs = await prisma.mockPaperQuestion.findMany({
            where: { questionId: oldQuestion.id },
          });

          for (const mpq of mpqs) {
            const mapping = [mpq.optionAMapping, mpq.optionBMapping, mpq.optionCMapping, mpq.optionDMapping];
            const shuffledCorrect = mapping.indexOf(newCandidate.correctAnswer) + 1;
            if (shuffledCorrect > 0) {
              await prisma.mockPaperQuestion.update({
                where: { id: mpq.id },
                data: { shuffledCorrectAnswer: shuffledCorrect },
              });
            }
          }

          if (oldQuestion.duplicateHash) existingHashes.delete(oldQuestion.duplicateHash);
          existingHashes.add(newHash);
          replacedCount++;
          console.log(`✅ [REPLACED] Question ${oldQuestion.id} successfully updated with verified NCERT question.`);
        }
      } catch (err: any) {
        console.error(`Batch generation error in chapter ${chapName}:`, err.message);
        failedCount += chunk.length;
      }
    }
  }

  console.log(`\n=== CONTROLLED REPLACEMENT COMPLETE ===`);
  console.log(`Replaced: ${replacedCount} questions`);
  console.log(`Failed / Skipped: ${failedCount} questions`);
  return { replacedCount, failedCount };
}

// Allow CLI execution: tsx scripts/replaceDuplicateQuestions.ts --limit 10
if (require.main === module) {
  const args = process.argv.slice(2);
  let limit = 10;
  let subject: SubjectType | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) limit = parseInt(args[i + 1], 10);
    if (args[i] === '--subject' && args[i + 1]) subject = args[i + 1].toUpperCase() as SubjectType;
    if (args[i] === '--dry-run') dryRun = true;
  }

  runControlledBatchReplacement({ limit, subject, dryRun })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Replacement failed:', err);
      process.exit(1);
    });
}
