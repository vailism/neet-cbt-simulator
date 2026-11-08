import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExamAttempt } from '@/lib/examEngine';
import { ExamMode } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let candidateId = body.candidateId;
    const {
      mode = 'FULL_MOCK',
      configCode = 'NEET_UG_DEFAULT',
      subjectFilter,
      chapterFilter,
      questionCount,
      durationMinutes,
      rollNumber: rawRoll,
      candidateName: rawName,
      name: fallbackName,
    } = body;

    const rollNumber = (rawRoll || '240410012345').trim().toUpperCase();
    const candidateName = (rawName || fallbackName || 'KUMAR ADITYA').trim().toUpperCase();

    // Upsert candidate dynamically
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

    const attempt = await generateExamAttempt({
      candidateId,
      mode: mode as ExamMode,
      configCode,
      subjectFilter,
      chapterFilter,
      questionCount: questionCount ? parseInt(questionCount, 10) : undefined,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      expiresAt: attempt.expiresAt,
      mode: attempt.mode,
      title: attempt.title,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        rollNumber: candidate.rollNumber,
      },
    });
  } catch (error: any) {
    console.error('Exam creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create examination attempt.' },
      { status: 500 }
    );
  }
}
