import { NextRequest, NextResponse } from 'next/server';
import { generateExamAttempt } from '@/lib/examEngine';
import { ExamMode } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidateId,
      mode = 'FULL_MOCK',
      configCode = 'NEET_UG_DEFAULT',
      subjectFilter,
      chapterFilter,
      questionCount,
      durationMinutes,
    } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId is required.' },
        { status: 400 }
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
