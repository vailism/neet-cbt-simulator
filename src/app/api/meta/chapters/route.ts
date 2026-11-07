import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        chapters: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ subjects });
  } catch (error: any) {
    console.error('Fetch metadata error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
