import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExamMode, AttemptStatus, QuestionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rollNumber = (searchParams.get('rollNumber') || '240410012345').trim().toUpperCase();

    const candidate = await prisma.candidate.findUnique({
      where: { rollNumber },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json({ mistakeCount: 0 });
    }

    // Get count of unique questions where student made a mistake
    const mistakes = await prisma.attemptQuestion.findMany({
      where: {
        attempt: {
          candidateId: candidate.id,
          status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.TIMED_OUT] },
        },
        isCorrect: false,
      },
      select: { questionId: true },
    });

    const uniqueQuestionIds = Array.from(new Set(mistakes.map((m) => m.questionId)));

    return NextResponse.json({
      success: true,
      mistakeCount: uniqueQuestionIds.length,
    });
  } catch (error: any) {
    console.error('Fetch mistake count error:', error);
    return NextResponse.json({ mistakeCount: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rollNumber = (body.rollNumber || '240410012345').trim().toUpperCase();

    const candidate = await prisma.candidate.findUnique({
      where: { rollNumber },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found.' },
        { status: 404 }
      );
    }

    // Fetch all questions answered incorrectly by this candidate across all completed exams
    const mistakeRecords = await prisma.attemptQuestion.findMany({
      where: {
        attempt: {
          candidateId: candidate.id,
          status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.TIMED_OUT] },
        },
        isCorrect: false,
      },
      include: {
        question: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (mistakeRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No mistakes recorded yet! Complete a full mock test first to unlock your personalized Mistake Drill.',
        },
        { status: 400 }
      );
    }

    // Deduplicate question IDs
    const seenIds = new Set<string>();
    const uniqueQuestions: Array<(typeof mistakeRecords)[0]['question']> = [];

    for (const rec of mistakeRecords) {
      if (!seenIds.has(rec.questionId)) {
        seenIds.add(rec.questionId);
        uniqueQuestions.push(rec.question);
      }
    }

    // Limit to max 45 questions per remedial session for peak focus
    const selectedQuestions = uniqueQuestions.slice(0, 45);
    const questionCount = selectedQuestions.length;
    const durationMinutes = Math.max(15, Math.round(questionCount * 1.5));
    const maxScore = questionCount * 4;

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Create Remedial Mistake Practice Attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        candidateId: candidate.id,
        mode: ExamMode.PRACTICE,
        title: `NEET Remedial Mistake Drill (${questionCount} Questions)`,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        expiresAt,
        maxScore,
        questions: {
          create: selectedQuestions.map((q, idx) => ({
            questionId: q.id,
            questionOrder: idx + 1,
            subjectCode: q.subject.code,
            status: idx === 0 ? QuestionStatus.NOT_ANSWERED : QuestionStatus.NOT_VISITED,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      questionCount,
      durationMinutes,
      title: attempt.title,
    });
  } catch (error: any) {
    console.error('Create mistake drill error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate mistake drill.' },
      { status: 500 }
    );
  }
}
