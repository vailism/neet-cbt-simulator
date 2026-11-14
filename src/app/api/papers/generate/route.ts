import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMockPaper } from '@/lib/mockPaperEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Dynamically calculate starting paper number from the current maximum
    const maxPaper = await prisma.mockPaper.aggregate({
      _max: { paperNumber: true },
    });
    const nextStart = (maxPaper._max.paperNumber || 0) + 1;

    const count = Math.min(20, Math.max(1, parseInt(body.count || '10', 10)));
    const startNumber = body.startNumber ? Math.max(1, parseInt(body.startNumber, 10)) : nextStart;
    const endNumber = body.endNumber
      ? Math.max(startNumber, parseInt(body.endNumber, 10))
      : startNumber + count - 1;

    const generatedPapers: any[] = [];

    for (let num = startNumber; num <= endNumber; num++) {
      const code = `MOCK_${num.toString().padStart(num > 99 ? 3 : 2, '0')}`;
      const title = `NEET 2015–2026 Pattern Mock Test ${num > 99 ? num : num.toString().padStart(2, '0')}`;

      const paper = await generateMockPaper({
        paperNumber: num,
        title,
        description: `Vailism CBT Exam Center • NEET (UG) 2015–2026 Pattern Full-Length Simulation (180 Questions, 720 Marks)`,
        seed: `VAILISM_NEET_2015_2026_SEED_${num}`,
        easyCount: 54,
        moderateCount: 90,
        difficultCount: 36,
        syllabusVersion: 'NMC_NEET_2027',
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
      startNumber,
      endNumber,
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
