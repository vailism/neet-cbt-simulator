import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AttemptStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { rollNumber: string } }
) {
  try {
    let rollNumber = params.rollNumber.trim().toUpperCase();
    if (rollNumber === 'ME' || rollNumber === 'DEFAULT') {
      rollNumber = '240410012345';
    }

    let candidate = await prisma.candidate.findUnique({
      where: { rollNumber },
      include: {
        attempts: {
          where: {
            status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.TIMED_OUT] },
          },
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            title: true,
            mode: true,
            startedAt: true,
            submittedAt: true,
            totalScore: true,
            maxScore: true,
            correctCount: true,
            incorrectCount: true,
            unattemptedCount: true,
            accuracy: true,
            timeSpentSeconds: true,
            physicsScore: true,
            chemistryScore: true,
            botanyScore: true,
            zoologyScore: true,
          },
        },
      },
    });

    if (!candidate) {
      // Find or create candidate profile gracefully
      candidate = await prisma.candidate.upsert({
        where: { rollNumber },
        update: {},
        create: {
          rollNumber,
          name: rollNumber === '240410012345' ? 'KUMAR ADITYA' : `CANDIDATE ${rollNumber}`,
          email: `${rollNumber.toLowerCase()}@neet.nta.ac.in`,
          avatarUrl: '/candidate-avatar.png',
        },
        include: {
          attempts: {
            where: {
              status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.TIMED_OUT] },
            },
            select: {
              id: true,
              title: true,
              mode: true,
              startedAt: true,
              submittedAt: true,
              totalScore: true,
              maxScore: true,
              correctCount: true,
              incorrectCount: true,
              unattemptedCount: true,
              accuracy: true,
              timeSpentSeconds: true,
              physicsScore: true,
              chemistryScore: true,
              botanyScore: true,
              zoologyScore: true,
            },
          },
        },
      });
    }

    const attempts = candidate.attempts;
    const totalAttempts = attempts.length;

    let highestScore = 0;
    let totalScoreSum = 0;
    let totalAccuracySum = 0;

    let physicsScoreSum = 0;
    let chemistryScoreSum = 0;
    let botanyScoreSum = 0;
    let zoologyScoreSum = 0;

    for (const a of attempts) {
      const score = a.totalScore ?? 0;
      if (score > highestScore) highestScore = score;
      totalScoreSum += score;
      totalAccuracySum += a.accuracy ?? 0;
      physicsScoreSum += a.physicsScore ?? 0;
      chemistryScoreSum += a.chemistryScore ?? 0;
      botanyScoreSum += a.botanyScore ?? 0;
      zoologyScoreSum += a.zoologyScore ?? 0;
    }

    const averageScore = totalAttempts > 0 ? Math.round(totalScoreSum / totalAttempts) : 0;
    const averageAccuracy =
      totalAttempts > 0 ? Math.round((totalAccuracySum / totalAttempts) * 10) / 10 : 0;

    const subjectAverages = {
      physics: totalAttempts > 0 ? Math.round(physicsScoreSum / totalAttempts) : 0,
      chemistry: totalAttempts > 0 ? Math.round(chemistryScoreSum / totalAttempts) : 0,
      botany: totalAttempts > 0 ? Math.round(botanyScoreSum / totalAttempts) : 0,
      zoology: totalAttempts > 0 ? Math.round(zoologyScoreSum / totalAttempts) : 0,
    };

    // Accuracy trends over recent attempts (reversed so oldest -> newest for chart)
    const trends = attempts
      .slice(0, 10)
      .reverse()
      .map((a, idx) => ({
        index: idx + 1,
        date: new Date(a.startedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }),
        score: a.totalScore ?? 0,
        maxScore: a.maxScore,
        accuracy: a.accuracy ?? 0,
      }));

    // NCERT Chapter Heatmap Aggregation across all completed attempts
    const allChapters = await prisma.chapter.findMany({
      include: { subject: true },
      orderBy: [{ subject: { order: 'asc' } }, { name: 'asc' }],
    });

    const attemptIds = attempts.map((a) => a.id);
    const candidateAnswers =
      attemptIds.length > 0
        ? await prisma.attemptQuestion.findMany({
            where: {
              attemptId: { in: attemptIds },
              selectedOption: { not: null },
            },
            select: {
              isCorrect: true,
              question: {
                select: {
                  chapterId: true,
                },
              },
            },
          })
        : [];

    const chapterStatsMap: Record<string, { total: number; correct: number; incorrect: number }> = {};
    for (const ans of candidateAnswers) {
      const chId = ans.question?.chapterId;
      if (!chId) continue;
      if (!chapterStatsMap[chId]) {
        chapterStatsMap[chId] = { total: 0, correct: 0, incorrect: 0 };
      }
      chapterStatsMap[chId].total += 1;
      if (ans.isCorrect === true) {
        chapterStatsMap[chId].correct += 1;
      } else {
        chapterStatsMap[chId].incorrect += 1;
      }
    }

    const chapterHeatmap = allChapters.map((ch) => {
      const stats = chapterStatsMap[ch.id] || { total: 0, correct: 0, incorrect: 0 };
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
      let status: 'MASTERED' | 'PRACTICE' | 'CRITICAL' | 'UNATTEMPTED' = 'UNATTEMPTED';
      if (stats.total > 0) {
        if (accuracy! >= 75) status = 'MASTERED';
        else if (accuracy! >= 50) status = 'PRACTICE';
        else status = 'CRITICAL';
      }

      return {
        chapterId: ch.id,
        chapterName: ch.name,
        subjectCode: ch.subject.code,
        subjectName: ch.subject.name,
        totalAttempted: stats.total,
        correct: stats.correct,
        incorrect: stats.incorrect,
        accuracy,
        status,
      };
    });

    return NextResponse.json({
      candidate: {
        id: candidate.id,
        rollNumber: candidate.rollNumber,
        name: candidate.name,
        email: candidate.email,
        avatarUrl: candidate.avatarUrl,
      },
      stats: {
        totalAttempts,
        highestScore,
        averageScore,
        averageAccuracy,
        subjectAverages,
      },
      trends,
      recentAttempts: attempts.slice(0, 10),
      chapterHeatmap,
    });
  } catch (error: any) {
    console.error('Candidate dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
