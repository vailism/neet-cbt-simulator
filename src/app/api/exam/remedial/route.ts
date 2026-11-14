import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AttemptStatus, Difficulty, ExamMode, SubjectType, VerificationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rollNumber = (body.rollNumber || '240410012345').trim().toUpperCase();

    const candidate = await prisma.candidate.findUnique({
      where: { rollNumber },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate profile not found.' },
        { status: 404 }
      );
    }

    // 1. Analyze candidate's history to extract weak chapters
    const completedAttempts = await prisma.examAttempt.findMany({
      where: {
        candidateId: candidate.id,
        status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.TIMED_OUT] },
      },
      include: {
        questions: {
          include: {
            question: {
              include: { chapter: true, subject: true },
            },
          },
        },
      },
    });

    const chapterMistakeMap = new Map<string, { chapterId: string; name: string; mistakes: number; total: number }>();
    const previouslyAttemptedQuestionIds = new Set<string>();

    for (const att of completedAttempts) {
      for (const aq of att.questions) {
        previouslyAttemptedQuestionIds.add(aq.questionId);
        const chap = aq.question.chapter;
        if (chap) {
          if (!chapterMistakeMap.has(chap.id)) {
            chapterMistakeMap.set(chap.id, { chapterId: chap.id, name: chap.name, mistakes: 0, total: 0 });
          }
          const entry = chapterMistakeMap.get(chap.id)!;
          entry.total++;
          if (aq.isCorrect === false) {
            entry.mistakes++;
          }
        }
      }
    }

    // Sort chapters by most mistakes
    const rankedWeakChapters = Array.from(chapterMistakeMap.values())
      .filter((c) => c.mistakes > 0)
      .sort((a, b) => b.mistakes - a.mistakes)
      .map((c) => c.chapterId);

    // 2. Select target question pool
    let candidatePool: any[] = [];

    if (rankedWeakChapters.length > 0) {
      // Pull questions from candidate's top weak chapters
      candidatePool = await prisma.question.findMany({
        where: {
          chapterId: { in: rankedWeakChapters.slice(0, 8) },
          verificationStatus: VerificationStatus.VERIFIED,
          id: { notIn: Array.from(previouslyAttemptedQuestionIds) },
        },
        include: { chapter: true, subject: true },
      });
    }

    // If pool is under 45 questions, pull from general high-yield NCERT questions
    if (candidatePool.length < 45) {
      const remainingNeeded = 45 - candidatePool.length;
      const supplemental = await prisma.question.findMany({
        where: {
          verificationStatus: VerificationStatus.VERIFIED,
          id: {
            notIn: [
              ...Array.from(previouslyAttemptedQuestionIds),
              ...candidatePool.map((q) => q.id),
            ],
          },
        },
        include: { chapter: true, subject: true },
        take: remainingNeeded * 3,
      });

      // Shuffle supplemental
      const shuffledSupp = supplemental.sort(() => Math.random() - 0.5);
      candidatePool = [...candidatePool, ...shuffledSupp.slice(0, remainingNeeded)];
    }

    // Fallback if question bank is constrained: reuse least recently attempted
    if (candidatePool.length < 45) {
      const allFallback = await prisma.question.findMany({
        where: { verificationStatus: VerificationStatus.VERIFIED },
        include: { chapter: true, subject: true },
        take: 60,
      });
      candidatePool = allFallback.sort(() => Math.random() - 0.5).slice(0, 45);
    }

    // Ensure 45 questions exactly
    const selectedQuestions = candidatePool.slice(0, 45);

    // 3. Create dedicated Remedial Examination Attempt
    const now = new Date();
    const durationMinutes = 45; // 45 questions = 45 minutes target pace
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const attempt = await prisma.$transaction(async (tx) => {
      const createdAttempt = await tx.examAttempt.create({
        data: {
          candidateId: candidate.id,
          title: `Vailism Remedial Examination • Weak Chapter Mastery (45 Qs)`,
          mode: ExamMode.PRACTICE,
          startedAt: now,
          expiresAt,
          maxScore: 180, // 45 x 4
          totalScore: null,
          accuracy: null,
          status: AttemptStatus.IN_PROGRESS,
        },
      });

      await tx.attemptQuestion.createMany({
        data: selectedQuestions.map((q, idx) => ({
          attemptId: createdAttempt.id,
          questionId: q.id,
          questionOrder: idx + 1,
          subjectCode: q.subject.code,
          timeSpentSeconds: 0,
          status: 'NOT_VISITED',
        })),
      });

      return createdAttempt;
    });

    const targetChapterNames = Array.from(
      new Set(selectedQuestions.map((q) => q.chapter?.name).filter(Boolean))
    ).slice(0, 5);

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      totalQuestions: 45,
      durationMinutes: 45,
      targetChapters: targetChapterNames,
    });
  } catch (error: any) {
    console.error('Error generating remedial mock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create remedial test.' },
      { status: 500 }
    );
  }
}
