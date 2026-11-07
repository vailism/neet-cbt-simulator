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

    // Atomic check-and-lock: ensures only ONE submit process runs, preventing race conditions
    const updated = await prisma.examAttempt.updateMany({
      where: {
        id: attemptId,
        status: AttemptStatus.IN_PROGRESS,
      },
      data: {
        status: AttemptStatus.SUBMITTED,
      },
    });

    if (updated.count === 0) {
      const existing = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        select: { id: true, status: true },
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'Attempt not found.' },
          { status: 404 }
        );
      }

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

