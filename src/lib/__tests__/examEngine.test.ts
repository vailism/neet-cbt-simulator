import { getUpdatedQuestionStatus, generateExamAttempt, evaluateAttempt } from '../examEngine';
import { QuestionStatus, SubjectType, AttemptStatus } from '@prisma/client';
import { prisma } from '../prisma';

async function runTests() {
  console.log('=== RUNNING NEET CBT SIMULATOR CORE TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Question Status Transitions (NTA CBT Rules)
  console.log('--- Testing Question Status Transitions ---');

  // Visit a not visited question -> NOT_ANSWERED
  assert(
    getUpdatedQuestionStatus(QuestionStatus.NOT_VISITED, 'VISIT', false) === QuestionStatus.NOT_ANSWERED,
    'Visiting NOT_VISITED question changes to NOT_ANSWERED'
  );

  // Visit an answered question -> stays ANSWERED
  assert(
    getUpdatedQuestionStatus(QuestionStatus.ANSWERED, 'VISIT', true) === QuestionStatus.ANSWERED,
    'Visiting ANSWERED question preserves ANSWERED'
  );

  // Save & Next with selected option -> ANSWERED
  assert(
    getUpdatedQuestionStatus(QuestionStatus.NOT_ANSWERED, 'SAVE_AND_NEXT', true) === QuestionStatus.ANSWERED,
    'SAVE_AND_NEXT with selected option transitions to ANSWERED'
  );

  // Save & Next without option -> NOT_ANSWERED
  assert(
    getUpdatedQuestionStatus(QuestionStatus.NOT_ANSWERED, 'SAVE_AND_NEXT', false) === QuestionStatus.NOT_ANSWERED,
    'SAVE_AND_NEXT without option transitions to NOT_ANSWERED'
  );

  // Mark for review WITH option -> ANSWERED_AND_MARKED
  assert(
    getUpdatedQuestionStatus(QuestionStatus.NOT_ANSWERED, 'MARK_FOR_REVIEW', true) ===
      QuestionStatus.ANSWERED_AND_MARKED,
    'MARK_FOR_REVIEW with selected option transitions to ANSWERED_AND_MARKED'
  );

  // Mark for review WITHOUT option -> MARKED_FOR_REVIEW
  assert(
    getUpdatedQuestionStatus(QuestionStatus.NOT_ANSWERED, 'MARK_FOR_REVIEW', false) ===
      QuestionStatus.MARKED_FOR_REVIEW,
    'MARK_FOR_REVIEW without selected option transitions to MARKED_FOR_REVIEW'
  );

  // Clear Response -> NOT_ANSWERED
  assert(
    getUpdatedQuestionStatus(QuestionStatus.ANSWERED, 'CLEAR_RESPONSE', false) === QuestionStatus.NOT_ANSWERED,
    'CLEAR_RESPONSE resets status to NOT_ANSWERED'
  );

  // TEST 2: Generate Full Mock Exam Attempt (180 questions)
  console.log('\n--- Testing Full Mock Exam Generation ---');
  const candidate = await prisma.candidate.findFirst();
  if (!candidate) throw new Error('No candidate found in database');

  const attempt = await generateExamAttempt({
    candidateId: candidate.id,
  });

  const createdAttempt = await prisma.examAttempt.findUnique({
    where: { id: attempt.id },
    include: { questions: true },
  });

  assert(!!createdAttempt, 'Attempt successfully created in database');
  assert(createdAttempt?.questions.length === 180, `Generated exam has exactly 180 questions (found ${createdAttempt?.questions.length})`);
  assert(createdAttempt?.maxScore === 720, `Max score is 720 (found ${createdAttempt?.maxScore})`);

  // Count by subject
  const physicsCount = createdAttempt?.questions.filter((q) => q.subjectCode === SubjectType.PHYSICS).length;
  const chemCount = createdAttempt?.questions.filter((q) => q.subjectCode === SubjectType.CHEMISTRY).length;
  const botanyCount = createdAttempt?.questions.filter((q) => q.subjectCode === SubjectType.BOTANY).length;
  const zoologyCount = createdAttempt?.questions.filter((q) => q.subjectCode === SubjectType.ZOOLOGY).length;

  assert(physicsCount === 45, `Physics has exactly 45 questions (found ${physicsCount})`);
  assert(chemCount === 45, `Chemistry has exactly 45 questions (found ${chemCount})`);
  assert(botanyCount === 45, `Botany has exactly 45 questions (found ${botanyCount})`);
  assert(zoologyCount === 45, `Zoology has exactly 45 questions (found ${zoologyCount})`);

  // Verify timer calculation (180 mins from now)
  const durationMs = createdAttempt!.expiresAt.getTime() - createdAttempt!.startedAt.getTime();
  const durationMins = Math.round(durationMs / (60 * 1000));
  assert(durationMins === 180, `Attempt duration is 180 minutes (found ${durationMins})`);

  // TEST 3: Scoring Scheme (+4, -1, 0, Evaluation of Answered & Marked)
  console.log('\n--- Testing Scoring Engine (+4, -1, 0) ---');
  // Answer question 1 correctly
  const q1 = await prisma.question.findUnique({
    where: { id: createdAttempt!.questions[0].questionId },
  });
  await prisma.attemptQuestion.update({
    where: { id: createdAttempt!.questions[0].id },
    data: {
      selectedOption: q1!.correctAnswer,
      status: QuestionStatus.ANSWERED,
      timeSpentSeconds: 65,
    },
  });

  // Answer question 2 incorrectly
  const q2 = await prisma.question.findUnique({
    where: { id: createdAttempt!.questions[1].questionId },
  });
  const incorrectOption = q2!.correctAnswer === 1 ? 2 : 1;
  await prisma.attemptQuestion.update({
    where: { id: createdAttempt!.questions[1].id },
    data: {
      selectedOption: incorrectOption,
      status: QuestionStatus.ANSWERED,
      timeSpentSeconds: 40,
    },
  });

  // Question 3: Answered and Marked for Review (should be evaluated under NTA rules!)
  const q3 = await prisma.question.findUnique({
    where: { id: createdAttempt!.questions[2].questionId },
  });
  await prisma.attemptQuestion.update({
    where: { id: createdAttempt!.questions[2].id },
    data: {
      selectedOption: q3!.correctAnswer,
      status: QuestionStatus.ANSWERED_AND_MARKED,
      timeSpentSeconds: 50,
    },
  });

  // Question 4: Marked for Review without option (should NOT be evaluated, 0 marks)
  await prisma.attemptQuestion.update({
    where: { id: createdAttempt!.questions[3].id },
    data: {
      selectedOption: null,
      status: QuestionStatus.MARKED_FOR_REVIEW,
      timeSpentSeconds: 20,
    },
  });

  // Evaluate attempt
  const result = await evaluateAttempt(createdAttempt!.id);

  // Expected score: Q1 (+4) + Q2 (-1) + Q3 (+4) + Q4 (0) + 176 unattempted (0) = 7 marks
  assert(result.totalScore === 7, `Total score calculated correctly as +7 (found ${result.totalScore})`);
  assert(result.correctCount === 2, `Correct count is 2 (found ${result.correctCount})`);
  assert(result.incorrectCount === 1, `Incorrect count is 1 (found ${result.incorrectCount})`);
  assert(result.unattemptedCount === 177, `Unattempted count is 177 (found ${result.unattemptedCount})`);

  // Accuracy: 2 / (2 + 1) = 66.67%
  assert(Math.round(result.accuracy) === 67, `Accuracy calculated correctly as 67% (found ${result.accuracy}%)`);

  // Verify status updated to SUBMITTED
  const finalAttempt = await prisma.examAttempt.findUnique({
    where: { id: createdAttempt!.id },
  });
  assert(finalAttempt?.status === AttemptStatus.SUBMITTED, 'Attempt status transitioned to SUBMITTED');
  assert(!!finalAttempt?.submittedAt, 'Attempt has submittedAt timestamp');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

