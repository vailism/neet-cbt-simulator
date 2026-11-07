import { NextRequest, NextResponse } from 'next/server';
import { generateMockPaper } from '@/lib/mockPaperEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const startNumber = Math.max(1, parseInt(body.startNumber || '1', 10));
    const endNumber = Math.min(100, Math.max(startNumber, parseInt(body.endNumber || '10', 10)));

    const generatedPapers: any[] = [];

    for (let num = startNumber; num <= endNumber; num++) {
      const paper = await generateMockPaper({
        paperNumber: num,
        title: `NEET (UG) Official Mock Test ${num.toString().padStart(3, '0')}`,
        description: `Full-Length 180-Question CBT Mock Exam conforming strictly to NTA syllabus guidelines`,
      });
      generatedPapers.push({
        id: paper.id,
        paperNumber: paper.paperNumber,
        code: paper.code,
        title: paper.title,
      });
    }

    return NextResponse.json({
      success: true,
      count: generatedPapers.length,
      papers: generatedPapers,
    });
  } catch (error: any) {
    console.error('Batch paper generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate mock papers.' },
      { status: 500 }
    );
  }
}

