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

    const rollNumber = (body.rollNumber || '240410012345').trim().toUpperCase();
    const candidateName = (body.candidateName || body.name || 'KUMAR ADITYA').trim().toUpperCase();

    // Upsert candidate to support dynamic student names & roll numbers
    const candidate = await prisma.candidate.upsert({
      where: { rollNumber },
      update: {
        name: candidateName,
      },
      create: {
        rollNumber,
        name: candidateName,
        email: `${rollNumber.toLowerCase()}@neet.nta.ac.in`,
        avatarUrl: '/candidate-avatar.png',
      },
    });
    candidateId = candidate.id;

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
      candidate: {
        id: candidate.id,
        name: candidate.name,
        rollNumber: candidate.rollNumber,
      },
    });
  } catch (error: any) {
    console.error('Launch paper attempt error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start mock examination.' },
      { status: 500 }
    );
  }
}
