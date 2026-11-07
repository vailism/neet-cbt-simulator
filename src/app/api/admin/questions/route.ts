import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubjectType, Difficulty } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject') as SubjectType | null;
    const chapterId = searchParams.get('chapterId');
    const difficulty = searchParams.get('difficulty') as Difficulty | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (subject) {
      where.subject = { code: subject };
    }
    if (chapterId) {
      where.chapterId = chapterId;
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (search) {
      where.OR = [
        { statement: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, questions] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        include: {
          subject: true,
          chapter: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      questions,
    });
  } catch (error: any) {
    console.error('Fetch questions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subjectCode,
      chapterName,
      topic,
      statement,
      imageUrl,
      option1,
      option2,
      option3,
      option4,
      correctAnswer,
      explanation,
      difficulty = 'MODERATE',
      previousYear,
      isVerifiedPYQ = false,
      source = 'Manual Entry',
    } = body;

    if (!subjectCode || !statement || !option1 || !option2 || !option3 || !option4 || !correctAnswer || !explanation) {
      return NextResponse.json(
        { error: 'All primary fields (subject, statement, 4 options, correct answer, explanation) are required.' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { code: subjectCode as SubjectType },
    });
    if (!subject) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    let chapterId: string | null = null;
    if (chapterName && chapterName.trim()) {
      const chapter = await prisma.chapter.upsert({
        where: {
          subjectId_name: {
            subjectId: subject.id,
            name: chapterName.trim(),
          },
        },
        update: {},
        create: {
          subjectId: subject.id,
          name: chapterName.trim(),
        },
      });
      chapterId = chapter.id;
    }

    const question = await prisma.question.create({
      data: {
        subjectId: subject.id,
        chapterId,
        topic: topic ? topic.trim() : null,
        statement: statement.trim(),
        imageUrl: imageUrl ? imageUrl.trim() : null,
        option1: option1.trim(),
        option2: option2.trim(),
        option3: option3.trim(),
        option4: option4.trim(),
        correctAnswer: Number(correctAnswer),
        explanation: explanation.trim(),
        difficulty: difficulty as Difficulty,
        previousYear: previousYear ? previousYear.trim() : null,
        isVerifiedPYQ: Boolean(isVerifiedPYQ),
        source: source.trim(),
      },
      include: {
        subject: true,
        chapter: true,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    console.error('Create question error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      topic,
      statement,
      imageUrl,
      option1,
      option2,
      option3,
      option4,
      correctAnswer,
      explanation,
      difficulty,
      previousYear,
      isVerifiedPYQ,
      source,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question ID required.' }, { status: 400 });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        topic,
        statement,
        imageUrl: imageUrl || null,
        option1,
        option2,
        option3,
        option4,
        correctAnswer: correctAnswer ? Number(correctAnswer) : undefined,
        explanation,
        difficulty: difficulty as Difficulty,
        previousYear: previousYear || null,
        isVerifiedPYQ: isVerifiedPYQ !== undefined ? Boolean(isVerifiedPYQ) : undefined,
        source,
      },
      include: {
        subject: true,
        chapter: true,
      },
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    console.error('Update question error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Question ID required.' }, { status: 400 });
    }

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete question error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

