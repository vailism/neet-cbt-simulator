import { prisma } from './prisma';

export async function clearAllExamResults() {
  const attemptCount = await prisma.examAttempt.count();
  const attemptQuestionCount = await prisma.attemptQuestion.count();

  // Cascade delete on ExamAttempt removes all AttemptQuestion rows
  const deletedAttempts = await prisma.examAttempt.deleteMany({});

  return {
    deletedAttempts: deletedAttempts.count,
    previousAttemptCount: attemptCount,
    previousResponseCount: attemptQuestionCount,
  };
}

