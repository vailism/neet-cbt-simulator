import { prisma } from './prisma';
import { SubjectType, Difficulty, ExamMode, AttemptStatus, QuestionStatus } from '@prisma/client';

export interface ExamGenerationOptions {
  candidateId: string;
  mode?: ExamMode;
  configCode?: string;
  subjectFilter?: SubjectType;
  chapterFilter?: string;
  questionCount?: number;
  durationMinutes?: number;
  shuffleOptions?: boolean;
}

export interface ScoreSummary {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracy: number;
  totalTimeSpentSeconds: number;
  physicsScore: number;
  chemistryScore: number;
  botanyScore: number;
  zoologyScore: number;
  subjectWise: Record<
    SubjectType,
    {
      score: number;
      maxScore: number;
      correct: number;
      incorrect: number;
      unattempted: number;
      accuracy: number;
      timeSpentSeconds: number;
    }
  >;
  chapterWise: Array<{
    chapter: string;
    subject: SubjectType;
    total: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
  }>;
  difficultyWise: Record<
    Difficulty,
    {
      total: number;
      correct: number;
      incorrect: number;
      accuracy: number;
    }
  >;
  weakChapters: string[];
  strongChapters: string[];
}

// Utility: Fisher-Yates array shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates and persists a frozen examination paper for a candidate.
 */
export async function generateExamAttempt(options: ExamGenerationOptions) {
  const {
    candidateId,
    mode = ExamMode.FULL_MOCK,
    configCode = 'NEET_UG_DEFAULT',
    subjectFilter,
    chapterFilter,
    questionCount,
    durationMinutes: customDuration,
  } = options;

  // 1. Fetch Candidate
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) {
    throw new Error(`Candidate with ID ${candidateId} not found.`);
  }

  // 2. Fetch Exam Configuration
  const config = await prisma.examConfiguration.findFirst({
    where: configCode ? { code: configCode } : { isDefault: true },
  });

  const durationMinutes =
    customDuration ||
    (mode === ExamMode.PRACTICE ? Math.round((questionCount || 30) * 1) : config?.durationMinutes || 180);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // 3. Find recently attempted question IDs for this candidate to avoid repetitions
  const recentAttempts = await prisma.examAttempt.findMany({
    where: { candidateId },
    select: {
      questions: {
        select: { questionId: true },
      },
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  const recentQuestionIds = new Set<string>();
  for (const attempt of recentAttempts) {
    for (const q of attempt.questions) {
      recentQuestionIds.add(q.questionId);
    }
  }

  // 4. Question Selection Strategy
  let selectedQuestions: Array<{
    id: string;
    subjectCode: SubjectType;
  }> = [];

  if (mode === ExamMode.FULL_MOCK) {
    // Official NEET pattern: 45 questions per subject (Physics, Chemistry, Botany, Zoology)
    const subjects: SubjectType[] = [
      SubjectType.PHYSICS,
      SubjectType.CHEMISTRY,
      SubjectType.BOTANY,
      SubjectType.ZOOLOGY,
    ];

    const easyPct = config?.easyPercent || 30;
    const diffPct = config?.difficultPercent || 20;

    for (const subCode of subjects) {
      const subject = await prisma.subject.findUnique({
        where: { code: subCode },
      });
      if (!subject) continue;

      const targetCount = 45;
      const targetEasy = Math.round((targetCount * easyPct) / 100); // ~14
      const targetDiff = Math.round((targetCount * diffPct) / 100); // ~9
      const targetMod = targetCount - targetEasy - targetDiff; // ~22

      // Fetch questions by difficulty
      const [easyPool, modPool, diffPool] = await Promise.all([
        prisma.question.findMany({
          where: { subjectId: subject.id, difficulty: Difficulty.EASY },
          select: { id: true },
        }),
        prisma.question.findMany({
          where: { subjectId: subject.id, difficulty: Difficulty.MODERATE },
          select: { id: true },
        }),
        prisma.question.findMany({
          where: { subjectId: subject.id, difficulty: Difficulty.DIFFICULT },
          select: { id: true },
        }),
      ]);

      const pickFromPool = (pool: Array<{ id: string }>, count: number) => {
        // Prioritize questions not in recentQuestionIds
        const fresh = pool.filter((q) => !recentQuestionIds.has(q.id));
        const used = pool.filter((q) => recentQuestionIds.has(q.id));
        const combined = [...shuffleArray(fresh), ...shuffleArray(used)];
        return combined.slice(0, count);
      };

      const pickedEasy = pickFromPool(easyPool, targetEasy);
      const pickedMod = pickFromPool(modPool, targetMod);
      const pickedDiff = pickFromPool(diffPool, targetDiff);

      let subjectSelected = [...pickedEasy, ...pickedMod, ...pickedDiff];

      // If any bucket fell short, fill from remaining questions of that subject
      if (subjectSelected.length < targetCount) {
        const selectedIds = new Set(subjectSelected.map((q) => q.id));
        const fallbackPool = await prisma.question.findMany({
          where: {
            subjectId: subject.id,
            id: { notIn: Array.from(selectedIds) },
          },
          select: { id: true },
          take: targetCount - subjectSelected.length,
        });
        subjectSelected = [...subjectSelected, ...fallbackPool];
      }

      // Shuffle order of questions within the subject
      const shuffledSubjectQuestions = shuffleArray(subjectSelected).slice(0, targetCount);

      selectedQuestions.push(
        ...shuffledSubjectQuestions.map((q) => ({
          id: q.id,
          subjectCode: subCode,
        }))
      );
    }
  } else {
    // PRACTICE MODE: filter by subject / chapter / count
    const whereClause: any = {};
    if (subjectFilter) {
      const subject = await prisma.subject.findUnique({
        where: { code: subjectFilter },
      });
      if (subject) whereClause.subjectId = subject.id;
    }
    if (chapterFilter) {
      whereClause.chapter = { name: chapterFilter };
    }

    const pool = await prisma.question.findMany({
      where: whereClause,
      include: { subject: true },
    });

    const targetCount = questionCount || Math.min(30, pool.length);
    const shuffled = shuffleArray(pool).slice(0, targetCount);

    selectedQuestions = shuffled.map((q) => ({
      id: q.id,
      subjectCode: q.subject.code,
    }));
  }

  if (selectedQuestions.length === 0) {
    throw new Error('No questions found matching criteria for examination generation.');
  }

  // 5. Create Exam Attempt and freeze Question Paper
  const attempt = await prisma.$transaction(async (tx) => {
    const newAttempt = await tx.examAttempt.create({
      data: {
        candidateId,
        configId: config?.id || null,
        mode,
        title:
          mode === ExamMode.FULL_MOCK
            ? 'NEET (UG) CBT Full Mock Examination'
            : `NEET Practice: ${subjectFilter || 'All Subjects'}`,
        subjectFilter: subjectFilter || null,
        chapterFilter: chapterFilter || null,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: now,
        expiresAt,
        maxScore: selectedQuestions.length * (config?.marksPerCorrect || 4),
      },
    });

    // Create frozen AttemptQuestion records
    await tx.attemptQuestion.createMany({
      data: selectedQuestions.map((item, index) => ({
        attemptId: newAttempt.id,
        questionId: item.id,
        questionOrder: index + 1,
        subjectCode: item.subjectCode,
        status: QuestionStatus.NOT_VISITED,
        timeSpentSeconds: 0,
      })),
    });

    return newAttempt;
  });

  return attempt;
}

/**
 * Evaluates an examination attempt and computes detailed scoring analytics.
 */
export async function evaluateAttempt(attemptId: string): Promise<ScoreSummary> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      config: true,
      mockPaper: {
        include: { paperQuestions: true },
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
    throw new Error(`Attempt with ID ${attemptId} not found.`);
  }

  const marksPerCorrect = attempt.config?.marksPerCorrect ?? 4;
  const marksPerIncorrect = attempt.config?.marksPerIncorrect ?? -1;
  const marksPerUnanswered = attempt.config?.marksPerUnanswered ?? 0;

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let totalTimeSpentSeconds = 0;

  const subjectStats: Record<
    SubjectType,
    {
      score: number;
      maxScore: number;
      correct: number;
      incorrect: number;
      unattempted: number;
      accuracy: number;
      timeSpentSeconds: number;
    }
  > = {
    [SubjectType.PHYSICS]: { score: 0, maxScore: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0, timeSpentSeconds: 0 },
    [SubjectType.CHEMISTRY]: { score: 0, maxScore: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0, timeSpentSeconds: 0 },
    [SubjectType.BOTANY]: { score: 0, maxScore: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0, timeSpentSeconds: 0 },
    [SubjectType.ZOOLOGY]: { score: 0, maxScore: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0, timeSpentSeconds: 0 },
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

  const updateItems: Array<{
    id: string;
    isCorrect: boolean | null;
    marksAwarded: number;
  }> = [];

  for (const item of attempt.questions) {
    totalTimeSpentSeconds += item.timeSpentSeconds;
    const sub = item.subjectCode;
    subjectStats[sub].maxScore += marksPerCorrect;
    subjectStats[sub].timeSpentSeconds += item.timeSpentSeconds;

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
    const cStats = chapterMap.get(chapKey)!;
    cStats.total++;

    const diff = item.question.difficulty;
    difficultyStats[diff].total++;

    // Check if question is considered answered under NTA rules:
    // Status is ANSWERED or ANSWERED_AND_MARKED (and selectedOption is not null)
    const isConsideredAnswered =
      (item.status === QuestionStatus.ANSWERED ||
        item.status === QuestionStatus.ANSWERED_AND_MARKED) &&
      item.selectedOption !== null;

    // Build paperQuestion lookup for shuffled options (indexed by unique questionOrder)
    const pq = attempt.mockPaper?.paperQuestions?.find(
      (p) => p.questionOrder === item.questionOrder
    );
    const targetCorrectAnswer = pq ? pq.shuffledCorrectAnswer : item.question.correctAnswer;

    if (isConsideredAnswered) {
      if (item.selectedOption === targetCorrectAnswer) {
        // Correct
        totalScore += marksPerCorrect;
        correctCount++;
        subjectStats[sub].score += marksPerCorrect;
        subjectStats[sub].correct++;
        cStats.correct++;
        difficultyStats[diff].correct++;

        updateItems.push({
          id: item.id,
          isCorrect: true,
          marksAwarded: marksPerCorrect,
        });
      } else {
        // Incorrect
        totalScore += marksPerIncorrect;
        incorrectCount++;
        subjectStats[sub].score += marksPerIncorrect;
        subjectStats[sub].incorrect++;
        cStats.incorrect++;
        difficultyStats[diff].incorrect++;

        updateItems.push({
          id: item.id,
          isCorrect: false,
          marksAwarded: marksPerIncorrect,
        });
      }
    } else {
      // Unattempted (Not Answered, Not Visited, or Marked for Review without answer)
      totalScore += marksPerUnanswered;
      unattemptedCount++;
      subjectStats[sub].score += marksPerUnanswered;
      subjectStats[sub].unattempted++;
      cStats.unattempted++;

      updateItems.push({
        id: item.id,
        isCorrect: null,
        marksAwarded: marksPerUnanswered,
      });
    }
  }

  const attemptedCount = correctCount + incorrectCount;
  const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

  // Compute subject accuracies
  for (const s of Object.keys(subjectStats) as SubjectType[]) {
    const st = subjectStats[s];
    const sAttempted = st.correct + st.incorrect;
    st.accuracy = sAttempted > 0 ? (st.correct / sAttempted) * 100 : 0;
  }

  // Compute difficulty accuracies
  for (const d of Object.keys(difficultyStats) as Difficulty[]) {
    const dt = difficultyStats[d];
    const dAttempted = dt.correct + dt.incorrect;
    dt.accuracy = dAttempted > 0 ? (dt.correct / dAttempted) * 100 : 0;
  }

  // Chapter analysis
  const chapterWise = Array.from(chapterMap.values()).map((c) => {
    const cAttempted = c.correct + c.incorrect;
    const cAcc = cAttempted > 0 ? (c.correct / cAttempted) * 100 : 0;
    return {
      ...c,
      accuracy: Math.round(cAcc * 10) / 10,
    };
  });

  const weakChapters: string[] = [];
  const strongChapters: string[] = [];

  for (const c of chapterWise) {
    if (c.total >= 1) {
      if (c.incorrect > c.correct || (c.accuracy < 50 && c.correct + c.incorrect > 0)) {
        weakChapters.push(`${c.chapter} (${c.subject})`);
      } else if (c.accuracy >= 75 && c.correct > 0) {
        strongChapters.push(`${c.chapter} (${c.subject})`);
      }
    }
  }

  // Group update items by result for high-performance batch updates (optimal for Neon Serverless)
  const correctIds = updateItems.filter((u) => u.isCorrect === true).map((u) => u.id);
  const incorrectIds = updateItems.filter((u) => u.isCorrect === false).map((u) => u.id);
  const unattemptedIds = updateItems.filter((u) => u.isCorrect === null).map((u) => u.id);

  const txOperations = [];
  if (correctIds.length > 0) {
    txOperations.push(
      prisma.attemptQuestion.updateMany({
        where: { id: { in: correctIds } },
        data: {
          isCorrect: true,
          marksAwarded: marksPerCorrect,
        },
      })
    );
  }
  if (incorrectIds.length > 0) {
    txOperations.push(
      prisma.attemptQuestion.updateMany({
        where: { id: { in: incorrectIds } },
        data: {
          isCorrect: false,
          marksAwarded: marksPerIncorrect,
        },
      })
    );
  }
  if (unattemptedIds.length > 0) {
    txOperations.push(
      prisma.attemptQuestion.updateMany({
        where: { id: { in: unattemptedIds } },
        data: {
          isCorrect: null,
          marksAwarded: marksPerUnanswered,
        },
      })
    );
  }

  // Update Attempt record
  txOperations.push(
    prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        totalScore,
        correctCount,
        incorrectCount,
        unattemptedCount,
        accuracy: Math.round(accuracy * 100) / 100,
        timeSpentSeconds: totalTimeSpentSeconds,
        physicsScore: subjectStats[SubjectType.PHYSICS].score,
        chemistryScore: subjectStats[SubjectType.CHEMISTRY].score,
        botanyScore: subjectStats[SubjectType.BOTANY].score,
        zoologyScore: subjectStats[SubjectType.ZOOLOGY].score,
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    })
  );

  await prisma.$transaction(txOperations);

  return {
    totalScore,
    maxScore: attempt.questions.length * marksPerCorrect,
    correctCount,
    incorrectCount,
    unattemptedCount,
    accuracy: Math.round(accuracy * 100) / 100,
    totalTimeSpentSeconds,
    physicsScore: subjectStats[SubjectType.PHYSICS].score,
    chemistryScore: subjectStats[SubjectType.CHEMISTRY].score,
    botanyScore: subjectStats[SubjectType.BOTANY].score,
    zoologyScore: subjectStats[SubjectType.ZOOLOGY].score,
    subjectWise: subjectStats,
    chapterWise,
    difficultyWise: difficultyStats,
    weakChapters,
    strongChapters,
  };
}

/**
 * State Transition logic for question palette in NTA CBT.
 */
export function getUpdatedQuestionStatus(
  currentStatus: QuestionStatus,
  action: 'SAVE_AND_NEXT' | 'MARK_FOR_REVIEW' | 'CLEAR_RESPONSE' | 'VISIT',
  hasSelectedOption: boolean
): QuestionStatus {
  switch (action) {
    case 'VISIT':
      if (currentStatus === QuestionStatus.NOT_VISITED) {
        return QuestionStatus.NOT_ANSWERED;
      }
      return currentStatus;

    case 'SAVE_AND_NEXT':
      if (hasSelectedOption) {
        return QuestionStatus.ANSWERED;
      }
      return QuestionStatus.NOT_ANSWERED;

    case 'MARK_FOR_REVIEW':
      if (hasSelectedOption) {
        return QuestionStatus.ANSWERED_AND_MARKED;
      }
      return QuestionStatus.MARKED_FOR_REVIEW;

    case 'CLEAR_RESPONSE':
      return QuestionStatus.NOT_ANSWERED;

    default:
      return currentStatus;
  }
}
