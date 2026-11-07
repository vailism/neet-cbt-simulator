import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Difficulty, SubjectType, VerificationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      totalQuestions,
      verifiedQuestions,
      pendingQuestions,
      rejectedQuestions,
      needsReviewQuestions,
      totalPapers,
      physicsCount,
      chemistryCount,
      botanyCount,
      zoologyCount,
      easyCount,
      moderateCount,
      difficultCount,
    ] = await Promise.all([
      prisma.question.count(),
      prisma.question.count({ where: { verificationStatus: VerificationStatus.VERIFIED } }),
      prisma.question.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      prisma.question.count({ where: { verificationStatus: VerificationStatus.REJECTED } }),
      prisma.question.count({ where: { verificationStatus: VerificationStatus.NEEDS_REVIEW } }),
      prisma.mockPaper.count(),
      prisma.question.count({ where: { subject: { code: SubjectType.PHYSICS } } }),
      prisma.question.count({ where: { subject: { code: SubjectType.CHEMISTRY } } }),
      prisma.question.count({ where: { subject: { code: SubjectType.BOTANY } } }),
      prisma.question.count({ where: { subject: { code: SubjectType.ZOOLOGY } } }),
      prisma.question.count({ where: { difficulty: Difficulty.EASY } }),
      prisma.question.count({ where: { difficulty: Difficulty.MODERATE } }),
      prisma.question.count({ where: { difficulty: Difficulty.DIFFICULT } }),
    ]);

    // Chapters count
    const chapterStats = await prisma.chapter.findMany({
      include: {
        subject: { select: { code: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      overview: {
        totalQuestions,
        verifiedQuestions,
        pendingQuestions,
        rejectedQuestions,
        needsReviewQuestions,
        totalPapers,
      },
      bySubject: {
        PHYSICS: physicsCount,
        CHEMISTRY: chemistryCount,
        BOTANY: botanyCount,
        ZOOLOGY: zoologyCount,
      },
      byDifficulty: {
        EASY: easyCount,
        MODERATE: moderateCount,
        DIFFICULT: difficultCount,
      },
      chapters: chapterStats.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject.code,
        questionCount: c._count.questions,
      })),
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
