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
    } = body;

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
    });
  } catch (error: any) {
    console.error('Exam creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create examination attempt.' },
      { status: 500 }
    );
  }
}
