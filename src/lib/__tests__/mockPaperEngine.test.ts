import { generateMockPaper, launchMockPaperAttempt, createPRNG, seededShuffle } from '../mockPaperEngine';
import { validateQuestion, computeDuplicateHash, calculateJaccardSimilarity } from '../questionValidation';
import { prisma } from '../prisma';
import { Difficulty, QuestionSource, SubjectType } from '@prisma/client';

async function runMockEngineTests() {
  console.log('=== RUNNING NEET 100 MOCK PAPER ENGINE TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Question Validation & 7-Rule Pipeline
  console.log('--- Testing 7-Rule Question Validation Pipeline ---');
  const validQuestionInput = {
    subjectCode: SubjectType.PHYSICS,
    chapterName: 'Kinematics',
    topic: 'Rectilinear Motion',
    statement: 'A car starts from rest with acceleration $a = 2\\text{ m/s}^2$. What is its speed after $5\\text{ s}$?',
    option1: '$10\\text{ m/s}$',
    option2: '$20\\text{ m/s}$',
    option3: '$5\\text{ m/s}$',
    option4: '$2.5\\text{ m/s}$',
    correctAnswer: 1,
    explanation: 'Using $v = u + at$: with $u = 0, a = 2, t = 5$, we obtain $v = 10\\text{ m/s}$.',
    difficulty: Difficulty.EASY,
    questionSource: QuestionSource.NCERT_PRACTICE,
  };

  const validationResult = await validateQuestion(validQuestionInput);
  assert(validationResult.isValid === true, 'Valid question passes completeness and 4-option checks');
  assert(validationResult.errors.length === 0, 'No validation errors on conforming question');
  assert(!!validationResult.duplicateHash, 'Deterministic duplicateHash generated');

  // Negative Test: Incomplete options
  const incompleteInput = {
    ...validQuestionInput,
    option4: '', // Empty option
  };
  const failedValidation = await validateQuestion(incompleteInput);
  assert(failedValidation.isValid === false, 'Question with missing option is rejected');
  assert(failedValidation.errors.length > 0, 'Validation returns appropriate error message');

  // TEST 2: Duplicate Detection (Hash & Similarity)
  console.log('\n--- Testing Duplicate Detection Engine ---');
  const text1 = 'What is the unit of electric current in SI units?';
  const text2 = 'What is the unit of electric current in SI units?';
  const text3 = 'What is the SI unit of electric current in amperes?';

  const hash1 = computeDuplicateHash(text1);
  const hash2 = computeDuplicateHash(text2);
  assert(hash1 === hash2, 'Exact and normalized text produces identical duplicateHash');

  const simHigh = calculateJaccardSimilarity(text1, text3);
  assert(simHigh > 0.6, `High token similarity detected (${Math.round(simHigh * 100)}%)`);

  // TEST 3: Deterministic Seeded PRNG & Option Shuffling
  console.log('\n--- Testing Deterministic PRNG & Option Shuffling ---');
  const prng1 = createPRNG('TEST_SEED_ALPHA');
  const prng2 = createPRNG('TEST_SEED_ALPHA');

  const sampleArray = [1, 2, 3, 4, 5, 6, 7, 8];
  const shuffled1 = seededShuffle(sampleArray, prng1);
  const shuffled2 = seededShuffle(sampleArray, prng2);

  assert(
    JSON.stringify(shuffled1) === JSON.stringify(shuffled2),
    'Seeded PRNG produces 100% deterministic identical shuffles'
  );

  // Clean up any test papers from previous test runs
  await prisma.mockPaper.deleteMany({
    where: { paperNumber: { gte: 95 } },
  });

  // TEST 4: Full-Length 180-Question Mock Paper Generation
  console.log('\n--- Testing 180-Question Mock Paper Generation ---');
  const testPaperNumber = 99;
  const paper = await generateMockPaper({
    paperNumber: testPaperNumber,
    title: `NEET (UG) Official Mock Test ${testPaperNumber}`,
    seed: `TEST_SEED_PAPER_${testPaperNumber}`,
    easyCount: 54,
    moderateCount: 90,
    difficultCount: 36,
  });

  const fullPaper = await prisma.mockPaper.findUnique({
    where: { id: paper.id },
    include: {
      paperQuestions: {
        include: { question: true },
        orderBy: { questionOrder: 'asc' },
      },
    },
  });

  assert(!!fullPaper, 'Mock Paper created and persisted in PostgreSQL');
  assert(fullPaper?.totalQuestions === 180, 'Paper specifies 180 total questions');
  assert(fullPaper?.paperQuestions.length === 180, `Paper contains exactly 180 question records (found ${fullPaper?.paperQuestions.length})`);

  // Verify Subject Breakdown (45 each)
  const phyCount = fullPaper?.paperQuestions.filter((pq) => pq.subjectCode === SubjectType.PHYSICS).length;
  const chemCount = fullPaper?.paperQuestions.filter((pq) => pq.subjectCode === SubjectType.CHEMISTRY).length;
  const botCount = fullPaper?.paperQuestions.filter((pq) => pq.subjectCode === SubjectType.BOTANY).length;
  const zooCount = fullPaper?.paperQuestions.filter((pq) => pq.subjectCode === SubjectType.ZOOLOGY).length;

  assert(phyCount === 45, `Physics has exactly 45 questions (found ${phyCount})`);
  assert(chemCount === 45, `Chemistry has exactly 45 questions (found ${chemCount})`);
  assert(botCount === 45, `Botany has exactly 45 questions (found ${botCount})`);
  assert(zooCount === 45, `Zoology has exactly 45 questions (found ${zooCount})`);

  // Verify Zero Duplicate Questions within paper
  const questionIdsInPaper = new Set(fullPaper?.paperQuestions.map((pq) => pq.questionId));
  assert(
    questionIdsInPaper.size === 180,
    `Zero duplicate questions within paper: exactly 180 unique questions (found ${questionIdsInPaper.size})`
  );

  // TEST 5: Option Shuffling & Answer Mapping Invariant
  console.log('\n--- Testing Option Shuffling & Answer Mapping Integrity ---');
  const samplePQ = fullPaper!.paperQuestions[0];
  const origQuestion = samplePQ.question;

  // The shuffled options array
  const mappings = [
    samplePQ.optionAMapping,
    samplePQ.optionBMapping,
    samplePQ.optionCMapping,
    samplePQ.optionDMapping,
  ];

  // The mapped option at shuffledCorrectAnswer index should point to original correctAnswer
  const mappedOriginalIndex = mappings[samplePQ.shuffledCorrectAnswer - 1];
  assert(
    mappedOriginalIndex === origQuestion.correctAnswer,
    `Option shuffling preserves correct answer mapping (shuffled pos ${samplePQ.shuffledCorrectAnswer} maps to orig ${origQuestion.correctAnswer})`
  );

  // TEST 6: Examination Attempt & Retake Non-Destructive Flow
  console.log('\n--- Testing Retake Functionality (Non-Destructive) ---');
  const candidate = await prisma.candidate.findFirst();
  if (!candidate) throw new Error('Candidate required');

  // Attempt 1
  const attempt1Result = await launchMockPaperAttempt(paper.id, candidate.id);
  assert(attempt1Result.attemptNumber === 1, 'First launch creates Attempt #1');

  // Simulate completion of Attempt 1
  await prisma.examAttempt.update({
    where: { id: attempt1Result.attemptId },
    data: {
      status: 'SUBMITTED',
      totalScore: 450,
      submittedAt: new Date(),
    },
  });

  // Attempt 2 (Retake)
  const attempt2Result = await launchMockPaperAttempt(paper.id, candidate.id);
  assert(attempt2Result.attemptNumber === 2, 'Retaking creates Attempt #2');

  // Verify Attempt 1 remains intact in database
  const previousAttempt = await prisma.examAttempt.findUnique({
    where: { id: attempt1Result.attemptId },
  });
  assert(previousAttempt?.totalScore === 450, 'Previous attempt #1 score is preserved without overwrite');

  // TEST 7: Query Performance Benchmark
  console.log('\n--- Testing Database Query Performance ---');
  const startTime = Date.now();
  await prisma.question.findMany({
    where: {
      verificationStatus: 'VERIFIED',
      difficulty: 'MODERATE',
    },
    take: 100,
  });
  const elapsed = Date.now() - startTime;
  assert(elapsed < 100, `PostgreSQL indexed query returned in ${elapsed}ms (< 100ms threshold)`);

  console.log('\n=============================================================');
  console.log(`MOCK PAPER ENGINE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) process.exit(1);
}

runMockEngineTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
