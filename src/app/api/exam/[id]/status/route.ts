import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AttemptStatus, QuestionStatus } from '@prisma/client';
import { evaluateAttempt } from '@/lib/examEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        candidate: {
          select: {
            id: true,
            rollNumber: true,
            name: true,
            avatarUrl: true,
          },
        },
        config: true,
        questions: {
          include: {
            question: {
              include: {
                chapter: true,
              },
            },
          },
          orderBy: { questionOrder: 'asc' },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Examination attempt not found.' },
        { status: 404 }
      );
    }

    const now = Date.now();
    const expiresAtMs = new Date(attempt.expiresAt).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

    let currentStatus = attempt.status;

    // Server-side automatic submission check if time expired
    if (remainingSeconds <= 0 && currentStatus === AttemptStatus.IN_PROGRESS) {
      console.log(`Exam attempt ${attemptId} expired. Triggering auto-submit.`);
      await evaluateAttempt(attemptId);
      await prisma.examAttempt.update({
        where: { id: attemptId },
        data: { status: AttemptStatus.TIMED_OUT },
      });
      currentStatus = AttemptStatus.TIMED_OUT;
    }

    const isFinished =
      currentStatus === AttemptStatus.SUBMITTED || currentStatus === AttemptStatus.TIMED_OUT;

    // Format questions list
    const questions = attempt.questions.map((item) => ({
      id: item.id,
      questionId: item.questionId,
      questionOrder: item.questionOrder,
      subjectCode: item.subjectCode,
      chapter: item.question.chapter?.name || 'General',
      topic: item.question.topic || '',
      statement: item.question.statement,
      imageUrl: item.question.imageUrl,
      option1: item.question.option1,
      option2: item.question.option2,
      option3: item.question.option3,
      option4: item.question.option4,
      selectedOption: item.selectedOption,
      isMarkedForReview: item.isMarkedForReview,
      status: item.status,
      timeSpentSeconds: item.timeSpentSeconds,
      // Answers and explanations are strictly omitted if exam is active
      ...(isFinished
        ? {
            correctAnswer: item.question.correctAnswer,
            explanation: item.question.explanation,
            isCorrect: item.isCorrect,
            marksAwarded: item.marksAwarded,
          }
        : {}),
    }));

    return NextResponse.json({
      attemptId: attempt.id,
      candidate: attempt.candidate,
      title: attempt.title,
      mode: attempt.mode,
      status: currentStatus,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      serverTime: new Date().toISOString(),
      remainingSeconds,
      totalQuestions: questions.length,
      questions,
      isFinished,
    });
  } catch (error: any) {
    console.error('Exam status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
