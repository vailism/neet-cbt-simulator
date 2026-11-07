import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateJaccardSimilarity } from '@/lib/questionValidation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Group by duplicateHash to find exact matches
    const duplicatesByHash = await prisma.question.groupBy({
      by: ['duplicateHash'],
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } },
      },
    });

    const exactDuplicateReports: any[] = [];

    for (const d of duplicatesByHash) {
      if (!d.duplicateHash) continue;
      const matched = await prisma.question.findMany({
        where: { duplicateHash: d.duplicateHash },
        select: {
          id: true,
          statement: true,
          subject: { select: { name: true } },
          chapter: { select: { name: true } },
          verificationStatus: true,
          createdAt: true,
        },
      });
      exactDuplicateReports.push({
        hash: d.duplicateHash,
        count: d._count.id,
        questions: matched,
      });
    }

    // 2. Sample check for high similarity across questions
    const sampleQuestions = await prisma.question.findMany({
      select: {
        id: true,
        statement: true,
        subjectId: true,
        subject: { select: { name: true } },
      },
      take: 60,
      orderBy: { createdAt: 'desc' },
    });

    const similarityMatches: any[] = [];
    for (let i = 0; i < sampleQuestions.length; i++) {
      for (let j = i + 1; j < sampleQuestions.length; j++) {
        const qA = sampleQuestions[i];
        const qB = sampleQuestions[j];
        if (qA.subjectId !== qB.subjectId) continue;

        const sim = calculateJaccardSimilarity(qA.statement, qB.statement);
        if (sim > 0.75 && sim < 1.0) {
          similarityMatches.push({
            similarityPercentage: Math.round(sim * 100),
            questionA: { id: qA.id, statement: qA.statement, subject: qA.subject.name },
            questionB: { id: qB.id, statement: qB.statement, subject: qB.subject.name },
          });
        }
      }
    }

    return NextResponse.json({
      exactDuplicatesCount: exactDuplicateReports.length,
      exactDuplicates: exactDuplicateReports,
      highSimilarityCount: similarityMatches.length,
      highSimilarityReports: similarityMatches.slice(0, 20),
    });
  } catch (error: any) {
    console.error('Duplicate detection error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
