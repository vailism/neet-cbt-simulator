import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionBatch, isGeminiConfigured } from '@/lib/geminiClient';
import { verifyQuestionQuality } from '@/lib/questionVerificationAgent';
import { prisma } from '@/lib/prisma';
import { Difficulty, QuestionSource, SubjectType, VerificationStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subjectCode = 'PHYSICS',
      chapterName = 'General',
      topic,
      difficulty = 'MODERATE',
      count = 25,
      model = 'gemini-2.5-flash',
      autoVerify = false,
    } = body;

    const batchSize = Math.min(50, Math.max(25, parseInt(count, 10) || 25));

    // 1. Generate questions using official Gemini client (or syllabus fallback)
    const result = await generateQuestionBatch({
      subject: subjectCode as SubjectType,
      chapterName,
      topic,
      batchSize,
      model,
      difficulty: difficulty as Difficulty,
    });

    // 2. Fetch or create chapter & subject in DB
    const subject = await prisma.subject.findUnique({
      where: { code: subjectCode as SubjectType },
    });
    if (!subject) {
      throw new Error(`Subject with code ${subjectCode} not found in database.`);
    }

    let chapter = await prisma.chapter.findFirst({
      where: { subjectId: subject.id, name: chapterName },
    });
    if (!chapter) {
      chapter = await prisma.chapter.create({
        data: { subjectId: subject.id, name: chapterName },
      });
    }

    // 3. Persist generated questions into the PENDING review queue
    const savedQuestions = [];
    for (const q of result.validQuestions) {
      // Run independent quality control check
      let status: VerificationStatus = VerificationStatus.PENDING;
      let rejectionReason: string | undefined;
      let reviewerNotes: string | undefined;
      let duplicateHash: string | undefined;

      if (autoVerify) {
        const verifyRes = await verifyQuestionQuality(
          {
            statement: q.statement,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            subject: subjectCode as SubjectType,
            chapterName,
            topic: q.topic || topic,
            difficulty: q.difficulty,
          },
          { checkDuplicateInDb: true }
        );

        status = verifyRes.status;
        rejectionReason = verifyRes.rejectionReason;
        reviewerNotes = verifyRes.reviewerNotes;
        duplicateHash = verifyRes.duplicateHash;
      }

      const created = await prisma.question.create({
        data: {
          subjectId: subject.id,
          chapterId: chapter.id,
          topic: q.topic || topic || 'General Concept',
          statement: q.statement,
          option1: q.option1,
          option2: q.option2,
          option3: q.option3,
          option4: q.option4,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          questionSource: QuestionSource.AI_GENERATED,
          source: `Gemini API Batch (${result.modelUsed})`,
          sourceYear: 2027,
          syllabusVersion: 'NMC_NEET_2027',
          verificationStatus: status,
          rejectionReason,
          reviewerNotes,
          duplicateHash,
          verifiedBy: status === VerificationStatus.VERIFIED ? 'GEMINI_INDEPENDENT_VERIFIER' : undefined,
          verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : undefined,
        },
      });
      savedQuestions.push(created);
    }

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      modelUsed: result.modelUsed,
      geminiConfigured: isGeminiConfigured(),
      requestedCount: batchSize,
      generatedCount: savedQuestions.length,
      failedCount: result.failedCount,
      message: `Batch complete: ${savedQuestions.length} questions created in ${autoVerify ? 'reviewed' : 'PENDING'} state.`,
    });
  } catch (error: any) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions.' },
      { status: 500 }
    );
  }
}

