import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Difficulty, QuestionSource, SubjectType, VerificationStatus } from '@prisma/client';
import { computeDuplicateHash, validateQuestion } from '@/lib/questionValidation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, subjectCode = 'PHYSICS', sourcePaper = 'NEET Exam Paper PDF Extraction' } = body;

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide question paper text for OCR extraction.' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { code: subjectCode as SubjectType },
    });
    if (!subject) throw new Error('Invalid subject code.');

    // Split text into potential question blocks using regex matching:
    // (e.g. "Q1.", "Question 1.", "1.", followed by (1)/(a)/(A)...)
    const questionBlocks = rawText
      .split(/(?:^|\n)(?:Q\.?\s*\d+[\.\:]|\d+[\.\:])\s*/i)
      .filter((block: string) => block.trim().length > 30);

    const extractedQuestions: any[] = [];

    for (let idx = 0; idx < questionBlocks.length; idx++) {
      const block = questionBlocks[idx].trim();

      // Heuristic parsing for options (1)/(2)/(3)/(4) or (A)/(B)/(C)/(D)
      const optParts = block.split(/(?:\([1-4a-dA-D]\)|(?:\n[1-4a-dA-D]\.))\s*/);
      if (optParts.length < 5) continue; // Needs statement + 4 options

      const statement = optParts[0].trim();
      const option1 = optParts[1].trim();
      const option2 = optParts[2].trim();
      const option3 = optParts[3].trim();
      const option4 = optParts[4].split(/(?:Answer|Ans|Explanation)[\:\s]/i)[0].trim();

      // Look for answer indicator in trailing text
      let detectedAnswer = 1;
      const ansMatch = block.match(/(?:Answer|Ans)[\:\s]*([1-4a-dA-D])/i);
      if (ansMatch) {
        const char = ansMatch[1].toUpperCase();
        if (char === '1' || char === 'A') detectedAnswer = 1;
        else if (char === '2' || char === 'B') detectedAnswer = 2;
        else if (char === '3' || char === 'C') detectedAnswer = 3;
        else if (char === '4' || char === 'D') detectedAnswer = 4;
      }

      // Default chapter
      const chapter = await prisma.chapter.upsert({
        where: {
          subjectId_name: {
            subjectId: subject.id,
            name: 'Extracted Questions',
          },
        },
        update: {},
        create: {
          subjectId: subject.id,
          name: 'Extracted Questions',
        },
      });

      const qInput = {
        subjectCode: subject.code,
        chapterName: chapter.name,
        statement,
        option1,
        option2,
        option3,
        option4,
        correctAnswer: detectedAnswer,
        explanation: 'Extracted via OCR pipeline. Requires subject expert review.',
        difficulty: Difficulty.MODERATE,
        questionSource: QuestionSource.NCERT_PRACTICE,
        sourcePaper,
      };

      const val = await validateQuestion(qInput);

      const created = await prisma.question.create({
        data: {
          subjectId: subject.id,
          chapterId: chapter.id,
          statement,
          option1,
          option2,
          option3,
          option4,
          correctAnswer: detectedAnswer,
          explanation: qInput.explanation,
          difficulty: Difficulty.MODERATE,
          questionSource: QuestionSource.NCERT_PRACTICE,
          source: sourcePaper,
          sourcePaper,
          verificationStatus: VerificationStatus.NEEDS_REVIEW, // Never auto-verified!
          duplicateHash: val.duplicateHash,
          reviewerNotes: 'Extracted from OCR paper. Please verify statement, diagram, formulas, and answer key.',
          isVerifiedPYQ: false,
        },
      });

      extractedQuestions.push(created);
    }

    return NextResponse.json({
      success: true,
      extractedCount: extractedQuestions.length,
      questions: extractedQuestions,
      message: `${extractedQuestions.length} questions extracted and queued under NEEDS_REVIEW for manual verification.`,
    });
  } catch (error: any) {
    console.error('OCR extract error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
