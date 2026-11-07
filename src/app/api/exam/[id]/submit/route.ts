import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evaluateAttempt } from '@/lib/examEngine';
import { AttemptStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, status: true },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found.' },
        { status: 404 }
      );
    }

    // If already submitted, return success without re-evaluating
    if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.TIMED_OUT) {
      return NextResponse.json({
        success: true,
        message: 'Exam already submitted.',
        attemptId,
      });
    }

    const summary = await evaluateAttempt(attemptId);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Exam submit error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

