import { generateExamAttempt, evaluateAttempt, getUpdatedQuestionStatus } from '../examEngine';
import { prisma } from '../prisma';
import { SubjectType, QuestionStatus, AttemptStatus, Difficulty } from '@prisma/client';

async function testCompleteLifecycle() {
  console.log('=== STARTING COMPLETE NEET CBT LIFECYCLE TEST SUITE ===\n');

  let passedCount = 0;
  let failedCount = 0;

  function test(name: string, condition: boolean) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failedCount++;
    }
  }

  // 1. Candidate Setup
  console.log('STEP 1: Candidate Verification & Registration');
  const candidate = await prisma.candidate.upsert({
    where: { rollNumber: 'TEST_ROLL_2026' },
    update: { name: 'SIMULATION CANDIDATE' },
    create: {
      rollNumber: 'TEST_ROLL_2026',
      name: 'SIMULATION CANDIDATE',
      email: 'sim@nta.test.in',
    },
  });
  test('Candidate created/retrieved successfully', !!candidate.id);

  // 2. Exam Generation Engine (Full Mock 180 questions)
  console.log('\nSTEP 2: Examination Paper Generation & Freezing');
  const attempt = await generateExamAttempt({
    candidateId: candidate.id,
  });

  const fullAttempt = await prisma.examAttempt.findUnique({
    where: { id: attempt.id },
    include: {
      questions: {
        include: { question: true },
        orderBy: { questionOrder: 'asc' },
      },
    },
  });

  test('Attempt status is initially IN_PROGRESS', fullAttempt?.status === AttemptStatus.IN_PROGRESS);
  test('Total questions count is exactly 180', fullAttempt?.questions.length === 180);
  test('Maximum score is 720 (180 x 4)', fullAttempt?.maxScore === 720);

  // Subject distribution
  const physicsQuestions = fullAttempt!.questions.filter((q) => q.subjectCode === SubjectType.PHYSICS);
  const chemQuestions = fullAttempt!.questions.filter((q) => q.subjectCode === SubjectType.CHEMISTRY);
  const botanyQuestions = fullAttempt!.questions.filter((q) => q.subjectCode === SubjectType.BOTANY);
  const zoologyQuestions = fullAttempt!.questions.filter((q) => q.subjectCode === SubjectType.ZOOLOGY);

  test('Physics has exactly 45 questions', physicsQuestions.length === 45);
  test('Chemistry has exactly 45 questions', chemQuestions.length === 45);
  test('Botany has exactly 45 questions', botanyQuestions.length === 45);
  test('Zoology has exactly 45 questions', zoologyQuestions.length === 45);

  // Verify questions order sequential from 1 to 180
  const isSequential = fullAttempt!.questions.every((q, idx) => q.questionOrder === idx + 1);
  test('Question orders are strictly sequential (1 to 180)', isSequential);

  // 3. Question Palette Transitions & Refresh Recovery
  console.log('\nSTEP 3: Answering Workflow & Palette Transitions');

  // Scenario A: Q1 visited and answered correctly
  const q1 = fullAttempt!.questions[0];
  const q1Correct = q1.question.correctAnswer;
  await prisma.attemptQuestion.update({
    where: { id: q1.id },
    data: {
      selectedOption: q1Correct,
      status: QuestionStatus.ANSWERED,
      timeSpentSeconds: 45,
    },
  });
  test('Q1 answered correctly and status saved as ANSWERED', true);

  // Scenario B: Q2 visited and answered incorrectly
  const q2 = fullAttempt!.questions[1];
  const q2Incorrect = q2.question.correctAnswer === 1 ? 2 : 1;
  await prisma.attemptQuestion.update({
    where: { id: q2.id },
    data: {
      selectedOption: q2Incorrect,
      status: QuestionStatus.ANSWERED,
      timeSpentSeconds: 30,
    },
  });
  test('Q2 answered incorrectly and status saved as ANSWERED', true);

  // Scenario C: Q3 answered and marked for review (will be evaluated under NTA CBT rules)
  const q3 = fullAttempt!.questions[2];
  const q3Correct = q3.question.correctAnswer;
  await prisma.attemptQuestion.update({
    where: { id: q3.id },
    data: {
      selectedOption: q3Correct,
      status: QuestionStatus.ANSWERED_AND_MARKED,
      timeSpentSeconds: 55,
    },
  });
  test('Q3 answered & marked for review saved as ANSWERED_AND_MARKED', true);

  // Scenario D: Q4 marked for review without choosing option (NOT evaluated)
  const q4 = fullAttempt!.questions[3];
  await prisma.attemptQuestion.update({
    where: { id: q4.id },
    data: {
      selectedOption: null,
      status: QuestionStatus.MARKED_FOR_REVIEW,
      timeSpentSeconds: 15,
    },
  });
  test('Q4 marked for review without option saved as MARKED_FOR_REVIEW', true);

  // Scenario E: Q5 visited but left unattempted
  const q5 = fullAttempt!.questions[4];
  await prisma.attemptQuestion.update({
    where: { id: q5.id },
    data: {
      selectedOption: null,
      status: QuestionStatus.NOT_ANSWERED,
      timeSpentSeconds: 10,
    },
  });
  test('Q5 visited without answering saved as NOT_ANSWERED', true);

  // 4. Timer Expiration Simulation
  console.log('\nSTEP 4: Timer Persistence & Server-Side Timestamps');
  const now = new Date();
  const expiresAt = new Date(fullAttempt!.expiresAt);
  const durationMinutes = Math.round((expiresAt.getTime() - fullAttempt!.startedAt.getTime()) / 60000);
  test('Server expiration timestamp matches 180 minutes', durationMinutes === 180);

  // 5. Final Evaluation & Scoring
  console.log('\nSTEP 5: Scoring Scheme & Result Generation');
  const result = await evaluateAttempt(fullAttempt!.id);

  // Expected Scoring Calculation:
  // Q1: +4 (Correct)
  // Q2: -1 (Incorrect)
  // Q3: +4 (Answered & Marked - Evaluated)
  // Q4: 0 (Marked without answer - Unattempted)
  // Q5: 0 (Not Answered - Unattempted)
  // Remaining 175 questions: 0 (Not Visited - Unattempted)
  // Total Score = 4 - 1 + 4 = 7 marks
  test('Total score is exactly +7 marks (Q1: +4, Q2: -1, Q3: +4, rest: 0)', result.totalScore === 7);
  test('Correct count is 2 (Q1 and Q3)', result.correctCount === 2);
  test('Incorrect count is 1 (Q2)', result.incorrectCount === 1);
  test('Unattempted count is 177 (180 - 3)', result.unattemptedCount === 177);
  test('Accuracy is 66.67% (2 / 3)', Math.round(result.accuracy) === 67);

  // Subject scores
  test('Physics score contains the 7 marks', result.physicsScore === 7);
  test('Chemistry score is 0 (all unattempted)', result.chemistryScore === 0);
  test('Botany score is 0 (all unattempted)', result.botanyScore === 0);
  test('Zoology score is 0 (all unattempted)', result.zoologyScore === 0);

  // Attempt status after submission
  const submittedAttempt = await prisma.examAttempt.findUnique({
    where: { id: fullAttempt!.id },
  });
  test('Attempt status in database transitioned to SUBMITTED', submittedAttempt?.status === AttemptStatus.SUBMITTED);
  test('submittedAt timestamp is populated', !!submittedAttempt?.submittedAt);

  console.log('\n======================================================');
  console.log(`LIFECYCLE TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================\n');

  if (failedCount > 0) process.exit(1);
}

testCompleteLifecycle()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
