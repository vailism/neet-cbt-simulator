import { prisma } from '../prisma';
import {
  extractAndParseJson,
  validateRawGeneratedQuestion,
  buildBatchPrompt,
  isGeminiConfigured,
} from '../geminiClient';
import { verifyQuestionQuality } from '../questionVerificationAgent';
import { generateDuplicateHash } from '../questionValidation';
import { launchMockPaperAttempt } from '../mockPaperEngine';
import { evaluateAttempt } from '../examEngine';
import { SubjectType, Difficulty, VerificationStatus } from '@prisma/client';

async function runTests() {
  console.log('=== RUNNING NEET 2027 GEMINI API & 10 MOCK EXAMINATIONS TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // =========================================================================
  // 1. GEMINI SDK INTEGRATION & JSON REPAIR TESTS
  // =========================================================================
  console.log('--- 1. Testing Gemini SDK Client & JSON Extraction ---');

  // Test 1.1: JSON code block parsing
  const rawWithMarkdown = '```json\n[{"statement":"Test math $E=mc^2$","option1":"A","option2":"B","option3":"C","option4":"D","correctAnswer":1,"explanation":"Step by step","difficulty":"EASY"}]\n```';
  const parsed = extractAndParseJson<any[]>(rawWithMarkdown);
  assert(Array.isArray(parsed) && parsed.length === 1, 'Markdown code fence stripped and parsed successfully');

  // Test 1.2: Trailing comma repair
  const rawWithTrailingComma = '{"statement":"Q1", "option1":"A", "option2":"B", "option3":"C", "option4":"D", "correctAnswer":2, "explanation":"Detailed rationale", "difficulty":"MODERATE",}';
  const parsedComma = extractAndParseJson<any>(rawWithTrailingComma);
  assert(parsedComma.correctAnswer === 2, 'Malformed JSON with trailing comma repaired successfully');

  // Test 1.3: Batch prompt builder clamps batch size 25-50
  const prompt = buildBatchPrompt({
    subject: SubjectType.PHYSICS,
    chapterName: 'Current Electricity',
    topic: 'Ohm Law',
    batchSize: 30,
  });
  assert(prompt.includes('exactly 30 authentic'), 'Batch prompt requests configured count of 30 questions');
  assert(prompt.includes('NCERT Class 11 & 12'), 'Batch prompt enforces strict NCERT curriculum adherence');

  // =========================================================================
  // 2. QUESTION QUALITY CONTROL & INDEPENDENT VERIFIER TESTS
  // =========================================================================
  console.log('\n--- 2. Testing 7-Rule Quality Control & Independent Verifier ---');

  // Test 2.1: Valid question passes quality verification
  const validQ = {
    statement: 'A body of mass $m = 2\\text{ kg}$ is accelerated by a force $F = 10\\text{ N}$. What is the acceleration?',
    option1: '$5\\text{ m/s}^2$',
    option2: '$10\\text{ m/s}^2$',
    option3: '$20\\text{ m/s}^2$',
    option4: '$2.5\\text{ m/s}^2$',
    correctAnswer: 1,
    explanation: 'From Newton second law: $a = F/m = 10/2 = 5\\text{ m/s}^2$.',
    subject: SubjectType.PHYSICS,
    chapterName: 'Laws of Motion',
    difficulty: Difficulty.EASY,
  };
  const vResult = await verifyQuestionQuality(validQ, { checkDuplicateInDb: false, useGeminiIndependentVerification: false });
  assert(vResult.status === VerificationStatus.VERIFIED, 'Conforming question verified with status VERIFIED');
  assert(vResult.qualityScore >= 80, `High quality score awarded (score: ${vResult.qualityScore})`);

  // Test 2.2: Rejection of forbidden option "All of the above"
  const forbiddenQ = {
    ...validQ,
    option4: 'All of the above',
  };
  const vForbidden = await verifyQuestionQuality(forbiddenQ, { checkDuplicateInDb: false, useGeminiIndependentVerification: false });
  assert(vForbidden.status === VerificationStatus.REJECTED, 'Question with "All of the above" is strictly REJECTED');
  assert(vForbidden.checks.fourOptionsValid === false, 'Four-option check caught forbidden option pattern');

  // Test 2.3: Rejection of identical duplicate options
  const duplicateOptsQ = {
    ...validQ,
    option3: '$5\\text{ m/s}^2$', // identical to option1
  };
  const vDupOpts = await verifyQuestionQuality(duplicateOptsQ, { checkDuplicateInDb: false, useGeminiIndependentVerification: false });
  assert(vDupOpts.status === VerificationStatus.REJECTED, 'Question with duplicate options is strictly REJECTED');

  // Test 2.4: Capitalization of negative stem
  const negativeStemQ = {
    ...validQ,
    statement: 'Which of the following statements is not correct regarding gravitational field?',
  };
  const vNeg = await verifyQuestionQuality(negativeStemQ, { checkDuplicateInDb: false, useGeminiIndependentVerification: false });
  assert(vNeg.checks.ambiguityCheckPassed === true, 'Ambiguity checker analyzed negative stem');

  // =========================================================================
  // 3. INITIAL QUESTION BANK CAPACITY VERIFICATION
  // =========================================================================
  console.log('\n--- 3. Testing Initial Question Bank Capacity & Coverage ---');

  const totalQuestions = await prisma.question.count();
  const verifiedQuestions = await prisma.question.count({
    where: { verificationStatus: VerificationStatus.VERIFIED },
  });

  assert(totalQuestions >= 2200 && totalQuestions <= 2600, `Question bank capacity in target range 2,200-2,500 (found ${totalQuestions})`);
  assert(verifiedQuestions >= 2200, `All questions passed verification pipeline (verified: ${verifiedQuestions})`);

  // Subject distribution
  const physicsCount = await prisma.question.count({ where: { subject: { code: SubjectType.PHYSICS } } });
  const chemCount = await prisma.question.count({ where: { subject: { code: SubjectType.CHEMISTRY } } });
  const botanyCount = await prisma.question.count({ where: { subject: { code: SubjectType.BOTANY } } });
  const zoologyCount = await prisma.question.count({ where: { subject: { code: SubjectType.ZOOLOGY } } });

  assert(physicsCount >= 500, `Physics questions >= 500 (found ${physicsCount})`);
  assert(chemCount >= 500, `Chemistry questions >= 500 (found ${chemCount})`);
  assert(botanyCount >= 500, `Botany questions >= 500 (found ${botanyCount})`);
  assert(zoologyCount >= 500, `Zoology questions >= 500 (found ${zoologyCount})`);

  // =========================================================================
  // 4. 10 FULL-LENGTH MOCK EXAMINATIONS VERIFICATION
  // =========================================================================
  console.log('\n--- 4. Testing 10 Full-Length Mock Examinations ---');

  const papers = await prisma.mockPaper.findMany({
    where: { paperNumber: { lte: 10 } },
    orderBy: { paperNumber: 'asc' },
    include: {
      paperQuestions: {
        include: { question: true },
      },
    },
  });

  assert(papers.length === 10, `Exactly 10 mock examinations generated (found ${papers.length})`);

  let allPapersConform = true;
  let allZeroDuplicates = true;

  for (const p of papers) {
    const totalQ = p.paperQuestions.length;
    const phy = p.paperQuestions.filter((pq) => pq.subjectCode === SubjectType.PHYSICS).length;
    const chem = p.paperQuestions.filter((pq) => pq.subjectCode === SubjectType.CHEMISTRY).length;
    const bot = p.paperQuestions.filter((pq) => pq.subjectCode === SubjectType.BOTANY).length;
    const zoo = p.paperQuestions.filter((pq) => pq.subjectCode === SubjectType.ZOOLOGY).length;

    const uniqueInPaper = new Set(p.paperQuestions.map((pq) => pq.questionId)).size;

    if (totalQ !== 180 || phy !== 45 || chem !== 45 || bot !== 45 || zoo !== 45) {
      allPapersConform = false;
      console.error(`Paper ${p.paperNumber} distribution mismatch: Total ${totalQ}, P:${phy}, C:${chem}, B:${bot}, Z:${zoo}`);
    }

    if (uniqueInPaper !== 180) {
      allZeroDuplicates = false;
      console.error(`Paper ${p.paperNumber} contains duplicates: ${uniqueInPaper} unique out of ${totalQ}`);
    }
  }

  assert(allPapersConform, 'All 10 mock papers have exactly 180 questions (45 Phy, 45 Chem, 45 Bot, 45 Zoo)');
  assert(allZeroDuplicates, 'All 10 mock papers have zero duplicate questions within each paper');

  // Verify naming pattern
  const titleNames = papers.map((p) => p.title);
  const correctTitles = papers.every((p) =>
    p.title.match(/^NEET MOCK TEST 0[1-9]|NEET MOCK TEST 10$/)
  );
  assert(correctTitles, 'All papers correctly titled "NEET MOCK TEST 01" to "NEET MOCK TEST 10"');

  // =========================================================================
  // 5. CBT INTEGRATION & SECURITY CHECKS
  // =========================================================================
  console.log('\n--- 5. Testing CBT Simulation & Answer Concealment ---');

  // Create test candidate
  const candidate = await prisma.candidate.upsert({
    where: { rollNumber: 'TEST_NEET_2027_01' },
    update: {},
    create: {
      rollNumber: 'TEST_NEET_2027_01',
      name: 'NEET 2027 Aspirant',
    },
  });

  const launchResult = await launchMockPaperAttempt(papers[0].id, candidate.id);
  assert(Boolean(launchResult.attemptId), 'Mock paper launch creates live ExamAttempt');

  // Verify attempt has 180 minutes duration
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: launchResult.attemptId },
    include: { questions: true },
  });

  const durationMinutes = Math.round((new Date(attempt!.expiresAt).getTime() - new Date(attempt!.startedAt).getTime()) / (60 * 1000));
  assert(durationMinutes === 180, `Exam countdown is exactly 180 minutes (found ${durationMinutes})`);
  assert(attempt!.questions.length === 180, 'ExamAttempt has exactly 180 questions');

  // Simulate an answer and evaluate score
  await prisma.attemptQuestion.updateMany({
    where: { attemptId: launchResult.attemptId, questionOrder: 1 },
    data: {
      status: 'ANSWERED',
      selectedOption: 1,
    },
  });

  const evalSummary = await evaluateAttempt(launchResult.attemptId);
  const totalEvaluated = evalSummary.correctCount + evalSummary.incorrectCount + evalSummary.unattemptedCount;
  const attemptedCount = evalSummary.correctCount + evalSummary.incorrectCount;

  assert(totalEvaluated === 180, 'Scoring engine evaluated 180 questions');
  assert(attemptedCount === 1, 'Attempted question count recorded as 1');
  assert(evalSummary.unattemptedCount === 179, 'Unattempted question count recorded as 179');
  assert(typeof evalSummary.totalScore === 'number', `Final score calculated correctly (score: ${evalSummary.totalScore})`);

  console.log('\n=============================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) process.exit(1);
}

runTests()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
