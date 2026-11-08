import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateRoll = searchParams.get('rollNumber') || '240410012345';

    let candidateId: string | undefined;
    if (candidateRoll) {
      const candidate = await prisma.candidate.findUnique({
        where: { rollNumber: candidateRoll.toUpperCase() },
        select: { id: true },
      });
      if (candidate) candidateId = candidate.id;
    }

    const papers = await prisma.mockPaper.findMany({
      orderBy: { paperNumber: 'asc' },
      include: {
        attempts: candidateId
          ? {
              where: { candidateId },
              orderBy: { attemptNumber: 'desc' },
              select: {
                id: true,
                status: true,
                totalScore: true,
                maxScore: true,
                accuracy: true,
                attemptNumber: true,
                submittedAt: true,
              },
            }
          : false,
      },
    });

    const papersWithStatus = papers.map((paper: any) => {
      const attempts = paper.attempts || [];
      const latestAttempt = attempts[0];
      const bestAttempt = [...attempts]
        .filter((a) => a.totalScore !== null)
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))[0];

      let attemptStatus = 'NOT_STARTED';
      if (latestAttempt) {
        if (latestAttempt.status === 'IN_PROGRESS') {
          attemptStatus = 'IN_PROGRESS';
        } else if (latestAttempt.status === 'SUBMITTED' || latestAttempt.status === 'TIMED_OUT') {
          attemptStatus = 'COMPLETED';
        }
      }

      return {
        id: paper.id,
        paperNumber: paper.paperNumber,
        code: paper.code,
        title: paper.title,
        description: paper.description,
        durationMinutes: paper.durationMinutes,
        totalQuestions: paper.totalQuestions,
        physicsCount: paper.physicsCount,
        chemistryCount: paper.chemistryCount,
        botanyCount: paper.botanyCount,
        zoologyCount: paper.zoologyCount,
        easyCount: paper.easyCount,
        moderateCount: paper.moderateCount,
        difficultCount: paper.difficultCount,
        syllabusVersion: paper.syllabusVersion,
        createdAt: paper.createdAt,
        attemptStatus,
        totalAttempts: attempts.length,
        latestAttemptId: latestAttempt?.id || null,
        bestScore: bestAttempt?.totalScore ?? null,
        bestAccuracy: bestAttempt?.accuracy ?? null,
        lastAttemptDate: latestAttempt?.submittedAt || null,
      };
    });

    return NextResponse.json({
      papers: papersWithStatus,
      totalPapers: papers.length,
    });
  } catch (error: any) {
    console.error('Fetch papers error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
