import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AttemptStatus, QuestionStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;
    const body = await req.json();
    const { attemptQuestionId, selectedOption, status, timeSpentDeltaSeconds = 0 } = body;

    if (!attemptQuestionId) {
      return NextResponse.json(
        { error: 'attemptQuestionId is required.' },
        { status: 400 }
      );
    }

    // 1. Check attempt status
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { status: true, expiresAt: true },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found.' },
        { status: 404 }
      );
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: 'Examination has already been submitted or timed out.' },
        { status: 403 }
      );
    }

    // Check expiration
    if (new Date(attempt.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Examination time has expired.' },
        { status: 403 }
      );
    }

    // 2. Update Question Answer
    const updated = await prisma.attemptQuestion.update({
      where: { id: attemptQuestionId },
      data: {
        selectedOption: selectedOption === null || selectedOption === undefined ? null : Number(selectedOption),
        status: status as QuestionStatus,
        isMarkedForReview:
          status === QuestionStatus.MARKED_FOR_REVIEW ||
          status === QuestionStatus.ANSWERED_AND_MARKED,
        timeSpentSeconds: {
          increment: Math.max(0, Number(timeSpentDeltaSeconds)),
        },
      },
    });

    return NextResponse.json({
      success: true,
      questionId: updated.questionId,
      status: updated.status,
      selectedOption: updated.selectedOption,
    });
  } catch (error: any) {
    console.error('Save answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
