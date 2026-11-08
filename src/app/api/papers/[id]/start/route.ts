import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { launchMockPaperAttempt } from '@/lib/mockPaperEngine';
import { ExamMode } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mockPaperId = params.id;
    const body = await req.json();
    let candidateId = body.candidateId;

    if (!candidateId && body.rollNumber) {
      const candidate = await prisma.candidate.findUnique({
        where: { rollNumber: body.rollNumber.toUpperCase() },
      });
      if (candidate) candidateId = candidate.id;
    }

    if (!candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { rollNumber: '240410012345' },
      });
      if (candidate) candidateId = candidate.id;
    }

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Default candidate not found in database.' },
        { status: 500 }
      );
    }

    const examMode = body.mode === 'PRACTICE'
      ? ExamMode.PRACTICE
      : ExamMode.FULL_MOCK;

    const durationMinutes = body.durationMinutes ? parseInt(body.durationMinutes, 10) : undefined;
    const forceNew = Boolean(body.forceNewAttempt || body.forceNew);

    const result = await launchMockPaperAttempt(mockPaperId, candidateId, {
      mode: examMode,
      durationMinutes,
      forceNew,
    });

    return NextResponse.json({
      success: true,
      attemptId: result.attemptId,
      isResumed: result.isResumed,
      attemptNumber: result.attemptNumber,
      mode: result.mode,
    });
  } catch (error: any) {
    console.error('Launch paper attempt error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start mock examination.' },
      { status: 500 }
    );
  }
}

