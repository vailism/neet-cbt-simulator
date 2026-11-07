import { prisma } from './prisma';
import { SubjectType, Difficulty, VerificationStatus, ExamMode } from '@prisma/client';

export interface PaperGenerationOptions {
  paperNumber: number;
  title?: string;
  description?: string;
  seed?: string;
  easyCount?: number;     // default 54
  moderateCount?: number; // default 90
  difficultCount?: number; // default 36
  syllabusVersion?: string;
  excludeQuestionIds?: string[]; // IDs used in previous papers to minimize repetition
}

/**
 * Seeded Pseudo-Random Number Generator (Mulberry32) for deterministic reproducibility.
 */
export function createPRNG(seedString: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 0x01000193);
  }
  let s = h >>> 0;

  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates array shuffle driven by deterministic PRNG.
 */
export function seededShuffle<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates and persists a deterministic Mock Paper with 180 questions.
 */
export async function generateMockPaper(options: PaperGenerationOptions) {
  const {
    paperNumber,
    title = `NEET MOCK TEST ${paperNumber.toString().padStart(2, '0')}`,
    description = `Official NEET UG 2027 CBT Full-Length Simulation (180 Questions, 720 Marks)`,
    seed = `NEET_2027_MOCK_SEED_${paperNumber.toString().padStart(2, '0')}`,
    easyCount = 54,
    moderateCount = 90,
    difficultCount = 36,
    syllabusVersion = 'NMC_NEET_2027',
    excludeQuestionIds = [],
  } = options;

  const prng = createPRNG(seed);
  const code = `MOCK_${paperNumber.toString().padStart(2, '0')}`;

  // Check if paper already exists
  const existing = await prisma.mockPaper.findUnique({
    where: { paperNumber },
    include: { paperQuestions: true },
  });
  if (existing && existing.paperQuestions.length === 180 && existing.title.startsWith('NEET MOCK TEST')) {
    return existing;
  }

  // 1. Fetch all VERIFIED questions grouped by subject and difficulty
  const subjects: SubjectType[] = [
    SubjectType.PHYSICS,
    SubjectType.CHEMISTRY,
    SubjectType.BOTANY,
    SubjectType.ZOOLOGY,
  ];

  // Target per subject: 45 questions
  // Breakdown per subject (proportionate to 54/90/36):
  // Easy per subject: ~14 questions
  // Moderate per subject: ~22-23 questions
  // Difficult per subject: ~9 questions
  const easyPerSub = Math.floor(easyCount / 4); // 13-14
  const diffPerSub = Math.floor(difficultCount / 4); // 9
  const modPerSub = 45 - easyPerSub - diffPerSub; // 22-23

  const paperQuestionsData: Array<{
    questionId: string;
    questionOrder: number;
    subjectCode: SubjectType;
    optionAMapping: number;
    optionBMapping: number;
    optionCMapping: number;
    optionDMapping: number;
    shuffledCorrectAnswer: number;
  }> = [];

  let globalOrder = 1;
  const paperQuestionIds = new Set<string>();

  for (const subCode of subjects) {
    const subject = await prisma.subject.findUnique({
      where: { code: subCode },
    });
    if (!subject) continue;

    const [easyPool, modPool, diffPool] = await Promise.all([
      prisma.question.findMany({
        where: {
          subjectId: subject.id,
          verificationStatus: VerificationStatus.VERIFIED,
          difficulty: Difficulty.EASY,
        },
      }),
      prisma.question.findMany({
        where: {
          subjectId: subject.id,
          verificationStatus: VerificationStatus.VERIFIED,
          difficulty: Difficulty.MODERATE,
        },
      }),
      prisma.question.findMany({
        where: {
          subjectId: subject.id,
          verificationStatus: VerificationStatus.VERIFIED,
          difficulty: Difficulty.DIFFICULT,
        },
      }),
    ]);

    const excludedSet = new Set(excludeQuestionIds);

    const pickQuestions = (pool: any[], target: number) => {
      const unusedInPaper = pool.filter((q) => !paperQuestionIds.has(q.id));
      const freshQuestions = unusedInPaper.filter((q) => !excludedSet.has(q.id));
      const poolToUse = freshQuestions.length >= target ? freshQuestions : unusedInPaper;

      const shuffled = seededShuffle(poolToUse, prng);
      const picked = shuffled.slice(0, target);
      for (const p of picked) {
        paperQuestionIds.add(p.id);
      }
      return picked;
    };

    let pickedEasy = pickQuestions(easyPool, easyPerSub);
    let pickedMod = pickQuestions(modPool, modPerSub);
    let pickedDiff = pickQuestions(diffPool, diffPerSub);

    let subjectQuestions = [...pickedEasy, ...pickedMod, ...pickedDiff];

    // Fallback if difficulty bucket ran short
    if (subjectQuestions.length < 45) {
      const allSubVerified = await prisma.question.findMany({
        where: {
          subjectId: subject.id,
          verificationStatus: VerificationStatus.VERIFIED,
          id: { notIn: Array.from(paperQuestionIds) },
        },
      });
      const freshAll = allSubVerified.filter((q) => !excludedSet.has(q.id));
      const poolToUse = freshAll.length >= (45 - subjectQuestions.length) ? freshAll : allSubVerified;
      const additional = seededShuffle(poolToUse, prng).slice(0, 45 - subjectQuestions.length);
      for (const a of additional) {
        paperQuestionIds.add(a.id);
      }
      subjectQuestions = [...subjectQuestions, ...additional];
    }

    // Shuffle questions within subject deterministically
    const finalSubList = seededShuffle(subjectQuestions, prng).slice(0, 45);

    for (const q of finalSubList) {
      // Randomize answer options (A, B, C, D) while preserving correct answer mapping
      // Original options: 1, 2, 3, 4
      const originalOptions = [1, 2, 3, 4];
      const shuffledOptions = seededShuffle(originalOptions, prng);

      // Find where original correctAnswer went in the shuffled array (index + 1)
      const shuffledCorrectIndex = shuffledOptions.indexOf(q.correctAnswer) + 1;

      paperQuestionsData.push({
        questionId: q.id,
        questionOrder: globalOrder++,
        subjectCode: subCode,
        optionAMapping: shuffledOptions[0],
        optionBMapping: shuffledOptions[1],
        optionCMapping: shuffledOptions[2],
        optionDMapping: shuffledOptions[3],
        shuffledCorrectAnswer: shuffledCorrectIndex,
      });
    }
  }

  // Persist MockPaper & MockPaperQuestion in an atomic transaction
  const createdPaper = await prisma.$transaction(async (tx) => {
    // Delete if existing partial
    await tx.mockPaper.deleteMany({
      where: { paperNumber },
    });

    const paper = await tx.mockPaper.create({
      data: {
        paperNumber,
        code,
        title,
        description,
        durationMinutes: 180,
        totalQuestions: 180,
        physicsCount: 45,
        chemistryCount: 45,
        botanyCount: 45,
        zoologyCount: 45,
        easyCount,
        moderateCount,
        difficultCount,
        randomSeed: seed,
        syllabusVersion,
      },
    });

    await tx.mockPaperQuestion.createMany({
      data: paperQuestionsData.map((pq) => ({
        mockPaperId: paper.id,
        questionId: pq.questionId,
        questionOrder: pq.questionOrder,
        subjectCode: pq.subjectCode,
        optionAMapping: pq.optionAMapping,
        optionBMapping: pq.optionBMapping,
        optionCMapping: pq.optionCMapping,
        optionDMapping: pq.optionDMapping,
        shuffledCorrectAnswer: pq.shuffledCorrectAnswer,
      })),
    });

    return paper;
  });

  return createdPaper;
}

export interface LaunchAttemptOptions {
  mode?: ExamMode;
  durationMinutes?: number;
  marksPerCorrect?: number;
  marksPerIncorrect?: number;
}

/**
 * Creates or resumes an examination attempt linked to a specific Mock Paper.
 * Retaking does NOT overwrite previous results!
 */
export async function launchMockPaperAttempt(
  mockPaperId: string,
  candidateId: string,
  options?: LaunchAttemptOptions
) {
  const paper = await prisma.mockPaper.findUnique({
    where: { id: mockPaperId },
    include: {
      paperQuestions: {
        include: { question: true },
        orderBy: { questionOrder: 'asc' },
      },
    },
  });

  if (!paper) throw new Error('Mock paper not found.');

  const examMode = options?.mode || ExamMode.FULL_MOCK;

  // Find previous attempts for this candidate on this paper with matching mode
  const existingAttempts = await prisma.examAttempt.findMany({
    where: {
      mockPaperId,
      candidateId,
      mode: examMode,
    },
    orderBy: { attemptNumber: 'desc' },
  });

  // If there's an IN_PROGRESS attempt, return it (Resume Interrupted Paper)
  const activeAttempt = existingAttempts.find((a) => a.status === 'IN_PROGRESS');
  if (activeAttempt) {
    return {
      attemptId: activeAttempt.id,
      isResumed: true,
      attemptNumber: activeAttempt.attemptNumber,
      mode: activeAttempt.mode,
    };
  }

  // Otherwise, create a NEW attempt (e.g. Attempt #2, Attempt #3)
  const nextAttemptNumber = existingAttempts.length + 1;
  const now = new Date();
  const examDuration = options?.durationMinutes || paper.durationMinutes || 180;
  const expiresAt = new Date(now.getTime() + examDuration * 60 * 1000);

  const titlePrefix = examMode === ExamMode.OMR_SIMULATION
    ? `${paper.title} [OMR Simulation]`
    : paper.title;

  const newAttempt = await prisma.$transaction(async (tx) => {
    const attempt = await tx.examAttempt.create({
      data: {
        candidateId,
        mockPaperId: paper.id,
        attemptNumber: nextAttemptNumber,
        mode: examMode,
        title: `${titlePrefix} (Attempt #${nextAttemptNumber})`,
        startedAt: now,
        expiresAt,
        maxScore: 720,
      },
    });

    // Populate attempt questions using the exact frozen shuffled paper questions
    await tx.attemptQuestion.createMany({
      data: paper.paperQuestions.map((pq) => ({
        attemptId: attempt.id,
        questionId: pq.questionId,
        questionOrder: pq.questionOrder,
        subjectCode: pq.subjectCode,
        status: 'NOT_VISITED',
        timeSpentSeconds: 0,
      })),
    });

    return attempt;
  });

  return {
    attemptId: newAttempt.id,
    isResumed: false,
    attemptNumber: nextAttemptNumber,
    mode: newAttempt.mode,
  };
}

/**
 * Generates the complete 10 NEET Full-Length Mock Papers (NEET MOCK TEST 01 to 10)
 * with minimal/zero question repetition across all 10 examinations.
 */
export async function generateTenMockPapers() {
  const generatedPapers = [];
  const globalUsedQuestionIds = new Set<string>();

  for (let num = 1; num <= 10; num++) {
    const paper = await generateMockPaper({
      paperNumber: num,
      title: `NEET MOCK TEST ${num.toString().padStart(2, '0')}`,
      description: `Official NEET UG 2027 CBT Full-Length Simulation (180 Questions, 720 Marks)`,
      seed: `NEET_2027_MOCK_SEED_${num.toString().padStart(2, '0')}`,
      easyCount: 54,
      moderateCount: 90,
      difficultCount: 36,
      syllabusVersion: 'NMC_NEET_2027',
      excludeQuestionIds: Array.from(globalUsedQuestionIds),
    });

    // Record question IDs used in this paper to exclude them from subsequent papers
    if (paper && (paper as any).paperQuestions) {
      for (const pq of (paper as any).paperQuestions) {
        globalUsedQuestionIds.add(pq.questionId);
      }
    }

    generatedPapers.push(paper);
  }

  return generatedPapers;
}
