import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionBatch } from '@/lib/aiQuestionGenerator';
import { Difficulty, SubjectType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subjectCode = 'PHYSICS',
      chapterName,
      topic,
      difficulty = 'MODERATE',
      count = 5,
    } = body;

    const result = await generateQuestionBatch({
      subjectCode: subjectCode as SubjectType,
      chapterName,
      topic,
      difficulty: difficulty as Difficulty,
      count: Math.min(25, Math.max(1, parseInt(count, 10))),
    });

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      generatedCount: result.generatedCount,
      message: `${result.generatedCount} questions generated and added to PENDING review queue.`,
    });
  } catch (error: any) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions.' },
      { status: 500 }
    );
  }
}
