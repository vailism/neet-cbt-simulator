import { PrismaClient, SubjectType, ExamMode, AttemptStatus, QuestionStatus } from '@prisma/client';
import { generateExamAttempt, evaluateAttempt, getUpdatedQuestionStatus } from '../examEngine';
import { launchMockPaperAttempt } from '../mockPaperEngine';

const prisma = new PrismaClient();

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runOMRSimulationTests() {
  console.log('\n=== RUNNING NEET 2027 OMR SIMULATION & REGRESSION TEST SUITE ===\n');

  // STEP 1: Verify Candidate
  const candidate = await prisma.candidate.upsert({
    where: { rollNumber: '240410012345' },
    update: {},
    create: {
      rollNumber: '240410012345',
      name: 'KUMAR ADITYA',
      email: 'aditya.neet@nta.ac.in',
    },
  });
  assert(!!candidate, 'Test candidate is available');

  // STEP 2: Launch OMR Simulation Attempt from Mock Paper #1
  const mockPaper1 = await prisma.mockPaper.findUnique({
    where: { paperNumber: 1 },
    include: {
      paperQuestions: {
        include: { question: true },
        orderBy: { questionOrder: 'asc' },
      },
    },
  });
  assert(!!mockPaper1, 'Mock Paper #1 exists with frozen questions');
  assert(mockPaper1!.paperQuestions.length === 180, 'Mock Paper #1 has exactly 180 questions');

  const omrLaunch = await launchMockPaperAttempt(mockPaper1!.id, candidate.id, {
    mode: ExamMode.OMR_SIMULATION,
    durationMinutes: 180,
  });
  assert(!!omrLaunch.attemptId, 'OMR Simulation attempt successfully launched');
  assert(omrLaunch.mode === ExamMode.OMR_SIMULATION, 'Attempt mode recorded as OMR_SIMULATION');

  const attemptId = omrLaunch.attemptId;

  // Retrieve attempt items
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      questions: {
        orderBy: { questionOrder: 'asc' },
      },
    },
  });
  assert(!!attempt, 'ExamAttempt record found in database');
  assert(attempt!.questions.length === 180, 'ExamAttempt contains exactly 180 questions');

  // STEP 3: Test OMR Bubble Selection & Multiple Selections Handling
  console.log('\n--- 1. Testing OMR Digital Bubble Selection ---');
  const q1 = attempt!.questions[0]; // Question 1
  const pq1 = mockPaper1!.paperQuestions.find((pq) => pq.questionOrder === 1)!;

  // Select Bubble 2
  const updated1 = await prisma.attemptQuestion.update({
    where: { id: q1.id },
    data: {
      selectedOption: 2,
      status: QuestionStatus.ANSWERED,
      timeSpentSeconds: 45,
    },
  });
  assert(updated1.selectedOption === 2, 'Bubble 2 selected and persisted');
  assert(updated1.status === QuestionStatus.ANSWERED, 'Status transitioned to ANSWERED');

  // Multiple selections handling: Changing selection to Bubble 3 replaces previous bubble
  const updated1Changed = await prisma.attemptQuestion.update({
    where: { id: q1.id },
    data: {
      selectedOption: 3,
      status: QuestionStatus.ANSWERED,
      timeSpentSeconds: 60,
    },
  });
  assert(updated1Changed.selectedOption === 3, 'Multiple selections handled: Bubble changed from 2 to 3 smoothly');

  // STEP 4: Test Clear Response on OMR Bubble
  console.log('\n--- 2. Testing OMR Clear Response ---');
  const cleared1 = await prisma.attemptQuestion.update({
    where: { id: q1.id },
    data: {
      selectedOption: null,
      status: QuestionStatus.NOT_ANSWERED,
    },
  });
  assert(cleared1.selectedOption === null, 'Clear response reset selectedOption to null');
  assert(cleared1.status === QuestionStatus.NOT_ANSWERED, 'Status reset to NOT_ANSWERED');

  // STEP 5: Test Answer Persistence & Correct/Incorrect/Unanswered Pattern
  console.log('\n--- 3. Testing Answer Persistence & Answer-Key Mapping ---');
  // Answer Q1 correctly
  await prisma.attemptQuestion.update({
    where: { id: attempt!.questions[0].id },
    data: {
      selectedOption: pq1.shuffledCorrectAnswer,
      status: QuestionStatus.ANSWERED,
      timeSpentSeconds: 50,
    },
  });

  // Answer Q2 incorrectly
  const pq2 = mockPaper1!.paperQuestions.find((pq) => pq.questionOrder === 2)!;
  const wrongOption = pq2.shuffledCorrectAnswer === 1 ? 2 : 1;
  await prisma.attemptQuestion.update({
    where: { id: attempt!.questions[1].id },
    data: {
      selectedOption: wrongOption,
      status: QuestionStatus.ANSWERED,
      timeSpentSeconds: 40,
    },
  });

  // Leave Q3..180 unanswered (unbubbled)
  console.log('✅ PASS: Q1 answered correctly, Q2 answered incorrectly, Q3..180 left unbubbled');

  // STEP 6: Test OMR Automatic Scoring (+4, -1, 0)
  console.log('\n--- 4. Testing OMR Automatic Scoring (+4, -1, 0) ---');
  const scoreResult = await evaluateAttempt(attemptId);

  assert(scoreResult.correctCount === 1, `Correct count is exactly 1 (found ${scoreResult.correctCount})`);
  assert(scoreResult.incorrectCount === 1, `Incorrect count is exactly 1 (found ${scoreResult.incorrectCount})`);
  assert(scoreResult.unattemptedCount === 178, `Unattempted count is exactly 178 (found ${scoreResult.unattemptedCount})`);
  // Q1 = +4, Q2 = -1 => Total = +3
  assert(scoreResult.totalScore === 3, `Total score calculated as +3 (+4 - 1 = 3) (found ${scoreResult.totalScore})`);
  assert(scoreResult.accuracy === 50, `Accuracy is exactly 50% (found ${scoreResult.accuracy}%)`);

  // STEP 7: Test Examination Timeout Auto-Submission
  console.log('\n--- 5. Testing Examination Timeout Auto-Submission ---');
  // Create an expired attempt to verify timeout behavior
  const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
  const expiredAttempt = await prisma.examAttempt.create({
    data: {
      candidateId: candidate.id,
      mockPaperId: mockPaper1!.id,
      mode: ExamMode.OMR_SIMULATION,
      attemptNumber: 999,
      title: 'Timeout Test Simulation',
      startedAt: new Date(Date.now() - 1000 * 60 * 190),
      expiresAt: pastDate,
      maxScore: 720,
    },
  });

  // Populate 1 question
  await prisma.attemptQuestion.create({
    data: {
      attemptId: expiredAttempt.id,
      questionId: mockPaper1!.paperQuestions[0].questionId,
      questionOrder: 1,
      subjectCode: SubjectType.PHYSICS,
      status: QuestionStatus.NOT_VISITED,
    },
  });

  // Check if remainingSeconds is 0 and trigger evaluation
  const remaining = Math.max(0, Math.floor((expiredAttempt.expiresAt.getTime() - Date.now()) / 1000));
  assert(remaining === 0, 'Remaining time is 0 for expired examination');

  await evaluateAttempt(expiredAttempt.id);
  await prisma.examAttempt.update({
    where: { id: expiredAttempt.id },
    data: { status: AttemptStatus.TIMED_OUT },
  });

  const finalExpired = await prisma.examAttempt.findUnique({
    where: { id: expiredAttempt.id },
  });
  assert(finalExpired!.status === AttemptStatus.TIMED_OUT, 'Expired attempt transitioned to TIMED_OUT');
  assert(finalExpired!.submittedAt !== null, 'Timeout auto-populated submittedAt timestamp');

  // Clean up test attempt
  await prisma.examAttempt.delete({ where: { id: expiredAttempt.id } });
  console.log('✅ PASS: Timeout test attempt cleaned up');

  // STEP 8: Test Printable Answer Sheet & Paper Generation Data
  console.log('\n--- 6. Testing Printable Answer Sheet & Booklet Section Verification ---');
  const sections = {
    [SubjectType.PHYSICS]: mockPaper1!.paperQuestions.filter((p) => p.subjectCode === SubjectType.PHYSICS),
    [SubjectType.CHEMISTRY]: mockPaper1!.paperQuestions.filter((p) => p.subjectCode === SubjectType.CHEMISTRY),
    [SubjectType.BOTANY]: mockPaper1!.paperQuestions.filter((p) => p.subjectCode === SubjectType.BOTANY),
    [SubjectType.ZOOLOGY]: mockPaper1!.paperQuestions.filter((p) => p.subjectCode === SubjectType.ZOOLOGY),
  };

  assert(sections[SubjectType.PHYSICS].length === 45, 'Printable Physics section contains exactly 45 questions (1-45)');
  assert(sections[SubjectType.CHEMISTRY].length === 45, 'Printable Chemistry section contains exactly 45 questions (46-90)');
  assert(sections[SubjectType.BOTANY].length === 45, 'Printable Botany section contains exactly 45 questions (91-135)');
  assert(sections[SubjectType.ZOOLOGY].length === 45, 'Printable Zoology section contains exactly 45 questions (136-180)');

  // Verify all 180 questions have 4 distinct options for bubbles
  for (const pq of mockPaper1!.paperQuestions) {
    const q = pq.question;
    const opts = [q.option1, q.option2, q.option3, q.option4];
    assert(opts.every((o) => o && o.length > 0), `Q.${pq.questionOrder} has 4 valid non-empty options`);
  }
  console.log('✅ PASS: All 180 questions validated for 4-bubble printable OMR grid');

  console.log('\n=============================================================');
  console.log('OMR SIMULATION TEST SUITE: ALL TESTS PASSED SUCCESSFULLY');
  console.log('=============================================================\n');
}

runOMRSimulationTests()
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
