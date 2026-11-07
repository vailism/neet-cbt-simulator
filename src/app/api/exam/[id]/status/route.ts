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
        mockPaper: {
          include: {
            paperQuestions: true,
          },
        },
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

    // Build MockPaperQuestion map if attempt is tied to a frozen paper (indexed by questionOrder)
    const pqMap = new Map<number, any>();
    if (attempt.mockPaper?.paperQuestions) {
      for (const pq of attempt.mockPaper.paperQuestions) {
        pqMap.set(pq.questionOrder, pq);
      }
    }

    // Format questions list
    const questions = attempt.questions.map((item) => {
      const pq = pqMap.get(item.questionOrder);
      const optMap: Record<number, string> = {
        1: item.question.option1,
        2: item.question.option2,
        3: item.question.option3,
        4: item.question.option4,
      };

      const option1 = pq ? optMap[pq.optionAMapping] : item.question.option1;
      const option2 = pq ? optMap[pq.optionBMapping] : item.question.option2;
      const option3 = pq ? optMap[pq.optionCMapping] : item.question.option3;
      const option4 = pq ? optMap[pq.optionDMapping] : item.question.option4;
      const correctAnswer = pq ? pq.shuffledCorrectAnswer : item.question.correctAnswer;

      return {
        id: item.id,
        questionId: item.questionId,
        questionOrder: item.questionOrder,
        subjectCode: item.subjectCode,
        chapter: item.question.chapter?.name || 'General',
        topic: item.question.topic || '',
        statement: item.question.statement,
        imageUrl: item.question.imageUrl,
        option1,
        option2,
        option3,
        option4,
        selectedOption: item.selectedOption,
        isMarkedForReview: item.isMarkedForReview,
        status: item.status,
        timeSpentSeconds: item.timeSpentSeconds,
        // Answers and explanations are strictly omitted if exam is active
        ...(isFinished
          ? {
              correctAnswer,
              explanation: item.question.explanation,
              isCorrect: item.isCorrect,
              marksAwarded: item.marksAwarded,
            }
          : {}),
      };
    });

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

