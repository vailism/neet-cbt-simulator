import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubjectType, Difficulty } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let questionsToImport: any[] = [];

    if (contentType.includes('application/json')) {
      const body = await req.json();
      questionsToImport = Array.isArray(body) ? body : body.questions;
    } else {
      // Text CSV parse
      const text = await req.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        return NextResponse.json(
          { error: 'CSV file is empty or missing data rows.' },
          { status: 400 }
        );
      }

      // Simple CSV parser supporting quotes
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
      const getCol = (cols: string[], name: string) => {
        const idx = header.indexOf(name.toLowerCase());
        return idx !== -1 ? cols[idx] : '';
      };

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 6) continue;

        questionsToImport.push({
          subjectCode: getCol(cols, 'subject') || getCol(cols, 'subjectcode'),
          chapterName: getCol(cols, 'chapter') || getCol(cols, 'chaptername'),
          topic: getCol(cols, 'topic'),
          statement: getCol(cols, 'statement') || getCol(cols, 'question'),
          option1: getCol(cols, 'option1'),
          option2: getCol(cols, 'option2'),
          option3: getCol(cols, 'option3'),
          option4: getCol(cols, 'option4'),
          correctAnswer: parseInt(getCol(cols, 'correctanswer') || '1', 10),
          explanation: getCol(cols, 'explanation'),
          difficulty: (getCol(cols, 'difficulty') || 'MODERATE').toUpperCase(),
          previousYear: getCol(cols, 'previousyear'),
          isVerifiedPYQ: getCol(cols, 'isverifiedpyq').toLowerCase() === 'true',
          source: getCol(cols, 'source') || 'CSV Import',
        });
      }
    }

    if (!Array.isArray(questionsToImport) || questionsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found to import.' },
        { status: 400 }
      );
    }

    // Cache subjects & chapters
    const subjects = await prisma.subject.findMany();
    const subjectMap = new Map(subjects.map((s) => [s.code, s.id]));
    const chapterMap = new Map<string, string>();

    let importedCount = 0;
    let skippedCount = 0;

    for (const q of questionsToImport) {
      const subCode = (q.subjectCode || q.subject || '').toUpperCase() as SubjectType;
      const subjectId = subjectMap.get(subCode);

      if (!subjectId || !q.statement || !q.option1 || !q.option2 || !q.option3 || !q.option4) {
        skippedCount++;
        continue;
      }

      let chapterId: string | null = null;
      const chapName = q.chapterName || q.chapter;
      if (chapName && chapName.trim()) {
        const key = `${subjectId}__${chapName.trim()}`;
        if (!chapterMap.has(key)) {
          const c = await prisma.chapter.upsert({
            where: {
              subjectId_name: {
                subjectId,
                name: chapName.trim(),
              },
            },
            update: {},
            create: {
              subjectId,
              name: chapName.trim(),
            },
          });
          chapterMap.set(key, c.id);
        }
        chapterId = chapterMap.get(key) || null;
      }

      const rawDiff = (q.difficulty || 'MODERATE').toUpperCase();
      const difficulty =
        rawDiff === 'EASY' || rawDiff === 'DIFFICULT' ? (rawDiff as Difficulty) : Difficulty.MODERATE;

      const ans = Number(q.correctAnswer);
      const validAns = ans >= 1 && ans <= 4 ? ans : 1;

      await prisma.question.create({
        data: {
          subjectId,
          chapterId,
          topic: q.topic || null,
          statement: q.statement,
          imageUrl: q.imageUrl || null,
          option1: q.option1,
          option2: q.option2,
          option3: q.option3,
          option4: q.option4,
          correctAnswer: validAns,
          explanation: q.explanation || 'Solution explanation provided.',
          difficulty,
          previousYear: q.previousYear || null,
          isVerifiedPYQ: Boolean(q.isVerifiedPYQ),
          source: q.source || 'Bulk Import',
        },
      });
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      totalProcessed: questionsToImport.length,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during import.' },
      { status: 500 }
    );
  }
}
