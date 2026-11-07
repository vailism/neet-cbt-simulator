import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubjectType, Difficulty } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        candidate: true,
        config: true,
        mockPaper: {
          include: {
            paperQuestions: true,
          },
        },
        questions: {
          include: {
            question: {
              include: {
                chapter: true,
              },
            },
          },
          orderBy: { questionOrder: 'asc' },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found.' },
        { status: 404 }
      );
    }

    const marksPerCorrect = attempt.config?.marksPerCorrect ?? 4;

    // Subject breakdown
    const subjectStats: Record<
      SubjectType,
      {
        subject: SubjectType;
        name: string;
        score: number;
        maxScore: number;
        correct: number;
        incorrect: number;
        unattempted: number;
        accuracy: number;
        timeSpentSeconds: number;
      }
    > = {
      [SubjectType.PHYSICS]: {
        subject: SubjectType.PHYSICS,
        name: 'Physics',
        score: attempt.physicsScore ?? 0,
        maxScore: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
      },
      [SubjectType.CHEMISTRY]: {
        subject: SubjectType.CHEMISTRY,
        name: 'Chemistry',
        score: attempt.chemistryScore ?? 0,
        maxScore: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
      },
      [SubjectType.BOTANY]: {
        subject: SubjectType.BOTANY,
        name: 'Botany',
        score: attempt.botanyScore ?? 0,
        maxScore: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
      },
      [SubjectType.ZOOLOGY]: {
        subject: SubjectType.ZOOLOGY,
        name: 'Zoology',
        score: attempt.zoologyScore ?? 0,
        maxScore: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
      },
    };

    const chapterMap = new Map<
      string,
      {
        chapter: string;
        subject: SubjectType;
        total: number;
        correct: number;
        incorrect: number;
        unattempted: number;
      }
    >();

    const difficultyStats: Record<
      Difficulty,
      {
        total: number;
        correct: number;
        incorrect: number;
        accuracy: number;
      }
    > = {
      [Difficulty.EASY]: { total: 0, correct: 0, incorrect: 0, accuracy: 0 },
      [Difficulty.MODERATE]: { total: 0, correct: 0, incorrect: 0, accuracy: 0 },
      [Difficulty.DIFFICULT]: { total: 0, correct: 0, incorrect: 0, accuracy: 0 },
    };

    const reviewQuestions = attempt.questions.map((item) => {
      const sub = item.subjectCode;
      subjectStats[sub].maxScore += marksPerCorrect;
      subjectStats[sub].timeSpentSeconds += item.timeSpentSeconds;

      if (item.isCorrect === true) {
        subjectStats[sub].correct++;
      } else if (item.isCorrect === false) {
        subjectStats[sub].incorrect++;
      } else {
        subjectStats[sub].unattempted++;
      }

      const chapName = item.question.chapter?.name || 'General';
      const chapKey = `${sub}__${chapName}`;
      if (!chapterMap.has(chapKey)) {
        chapterMap.set(chapKey, {
          chapter: chapName,
          subject: sub,
          total: 0,
          correct: 0,
          incorrect: 0,
          unattempted: 0,
        });
      }
      const c = chapterMap.get(chapKey)!;
      c.total++;
      if (item.isCorrect === true) c.correct++;
      else if (item.isCorrect === false) c.incorrect++;
      else c.unattempted++;

      const diff = item.question.difficulty;
      difficultyStats[diff].total++;
      if (item.isCorrect === true) difficultyStats[diff].correct++;
      else if (item.isCorrect === false) difficultyStats[diff].incorrect++;

      // Build MockPaperQuestion map if attempt is tied to a frozen paper
      const pq = attempt.mockPaper?.paperQuestions.find(
        (p) => p.questionId === item.questionId
      );
      const optMap: Record<number, string> = {
        1: item.question.option1,
        2: item.question.option2,
        3: item.question.option3,
        4: item.question.option4,
      };

      const option1 = pq ? optMap[pq.optionAMapping] : item.question.option1;
      const option2 = pq ? optMap[pq.optionBMapping] : item.question.option2;
      const option3 = pq ? optMap[pq.optionCMapping] : item.question.option3;
      const option4 = pq ? optMap[pq.optionDMapping] : item.question.option4;
      const correctAnswer = pq ? pq.shuffledCorrectAnswer : item.question.correctAnswer;

      return {
        id: item.id,
        questionOrder: item.questionOrder,
        subjectCode: item.subjectCode,
        chapter: chapName,
        topic: item.question.topic,
        difficulty: item.question.difficulty,
        statement: item.question.statement,
        imageUrl: item.question.imageUrl,
        option1,
        option2,
        option3,
        option4,
        selectedOption: item.selectedOption,
        correctAnswer,
        isCorrect: item.isCorrect,
        status: item.status,
        explanation: item.question.explanation,
        previousYear: item.question.previousYear,
        isVerifiedPYQ: item.question.isVerifiedPYQ,
        timeSpentSeconds: item.timeSpentSeconds,
        marksAwarded: item.marksAwarded ?? 0,
      };
    });

    // Subject accuracy
    for (const sub of Object.keys(subjectStats) as SubjectType[]) {
      const s = subjectStats[sub];
      const attempted = s.correct + s.incorrect;
      s.accuracy = attempted > 0 ? Math.round((s.correct / attempted) * 1000) / 10 : 0;
    }

    // Difficulty accuracy
    for (const diff of Object.keys(difficultyStats) as Difficulty[]) {
      const d = difficultyStats[diff];
      const attempted = d.correct + d.incorrect;
      d.accuracy = attempted > 0 ? Math.round((d.correct / attempted) * 1000) / 10 : 0;
    }

    // Chapter accuracy
    const chapterWise = Array.from(chapterMap.values()).map((c) => {
      const attempted = c.correct + c.incorrect;
      const acc = attempted > 0 ? Math.round((c.correct / attempted) * 1000) / 10 : 0;
      return {
        ...c,
        accuracy: acc,
      };
    });

    const weakChapters: string[] = [];
    const strongChapters: string[] = [];

    for (const c of chapterWise) {
      if (c.incorrect > c.correct || (c.accuracy < 50 && c.correct + c.incorrect > 0)) {
        weakChapters.push(`${c.chapter} (${c.subject})`);
      } else if (c.accuracy >= 75 && c.correct > 0) {
        strongChapters.push(`${c.chapter} (${c.subject})`);
      }
    }

    // Timing analysis: fastest & slowest correctly answered, average time
    const attemptedItems = reviewQuestions.filter((q) => q.timeSpentSeconds > 0);
    const sortedByTime = [...attemptedItems].sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds);
    const slowestQuestions = sortedByTime.slice(0, 5);
    const fastestQuestions = [...attemptedItems].sort((a, b) => a.timeSpentSeconds - b.timeSpentSeconds).slice(0, 5);
    const averageTimePerQuestion =
      attemptedItems.length > 0
        ? Math.round(
            attemptedItems.reduce((acc, q) => acc + q.timeSpentSeconds, 0) / attemptedItems.length
          )
        : 0;

    // Negative Marking Analysis
    const correctCount = attempt.correctCount ?? 0;
    const incorrectCount = attempt.incorrectCount ?? 0;
    const grossScore = correctCount * marksPerCorrect;
    const marksLostToNegatives = incorrectCount * 1;
    const netScore = attempt.totalScore ?? (grossScore - marksLostToNegatives);
    const penaltyPercentage = grossScore > 0 ? Math.round((marksLostToNegatives / grossScore) * 1000) / 10 : 0;

    // Previous Mocks Comparison for this Candidate
    const previousAttempts = await prisma.examAttempt.findMany({
      where: {
        candidateId: attempt.candidateId,
        status: { in: ['SUBMITTED', 'TIMED_OUT'] },
      },
      select: {
        id: true,
        title: true,
        mode: true,
        startedAt: true,
        totalScore: true,
        maxScore: true,
        accuracy: true,
        correctCount: true,
        incorrectCount: true,
      },
      orderBy: { startedAt: 'asc' },
      take: 10,
    });

    const previousMockComparison = previousAttempts.map((prev, idx) => ({
      mockIndex: idx + 1,
      attemptId: prev.id,
      title: prev.title.replace(/ \(Attempt #\d+\)/, ''),
      mode: prev.mode,
      date: new Date(prev.startedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      score: prev.totalScore ?? 0,
      maxScore: prev.maxScore,
      accuracy: prev.accuracy ?? 0,
      negatives: prev.incorrectCount ?? 0,
      isCurrent: prev.id === attempt.id,
    }));

    // Incorrect Question Notebook Items
    const incorrectNotebook = reviewQuestions
      .filter((q) => q.isCorrect === false)
      .map((q) => ({
        id: q.id,
        order: q.questionOrder,
        subject: q.subjectCode,
        chapter: q.chapter,
        statement: q.statement,
        selectedOption: q.selectedOption,
        selectedOptionText: (q as any)[`option${q.selectedOption}`] || 'None',
        correctAnswer: q.correctAnswer,
        correctOptionText: (q as any)[`option${q.correctAnswer}`] || '',
        explanation: q.explanation,
        timeSpent: q.timeSpentSeconds,
      }));

    return NextResponse.json({
      attemptId: attempt.id,
      title: attempt.title,
      mode: attempt.mode,
      candidate: attempt.candidate,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      status: attempt.status,
      overall: {
        totalScore: netScore,
        maxScore: attempt.maxScore,
        correctCount,
        incorrectCount,
        unattemptedCount: attempt.unattemptedCount ?? 0,
        accuracy: attempt.accuracy ?? 0,
        totalTimeSpentSeconds: attempt.timeSpentSeconds ?? 0,
        averageTimePerQuestion,
      },
      negativeMarking: {
        grossScore,
        marksLost: marksLostToNegatives,
        netScore,
        penaltyPercentage,
      },
      subjectWise: Object.values(subjectStats),
      chapterWise,
      difficultyWise: difficultyStats,
      weakChapters,
      strongChapters,
      previousMockComparison,
      incorrectNotebook,
      timing: {
        averageTimePerQuestion,
        slowestQuestions: slowestQuestions.map((q) => ({
          order: q.questionOrder,
          subject: q.subjectCode,
          timeSpent: q.timeSpentSeconds,
          isCorrect: q.isCorrect,
        })),
        fastestQuestions: fastestQuestions.map((q) => ({
          order: q.questionOrder,
          subject: q.subjectCode,
          timeSpent: q.timeSpentSeconds,
          isCorrect: q.isCorrect,
        })),
      },
      questions: reviewQuestions,
    });
  } catch (error: any) {
    console.error('Result report error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
