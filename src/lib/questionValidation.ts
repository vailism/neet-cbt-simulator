import crypto from 'crypto';
import { prisma } from './prisma';
import { Difficulty, QuestionSource, SubjectType, VerificationStatus } from '@prisma/client';

export interface QuestionValidationInput {
  subjectCode: SubjectType;
  chapterName: string;
  topic?: string | null;
  statement: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  explanation: string;
  difficulty?: Difficulty;
  questionSource?: QuestionSource;
  sourceYear?: number | null;
  sourcePaper?: string | null;
  syllabusVersion?: string;
  imageUrl?: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  status: VerificationStatus;
  errors: string[];
  warnings: string[];
  duplicateHash: string;
  duplicateQuestionId?: string;
  similarityScore?: number;
}

/**
 * Normalizes question text by stripping whitespace, punctuation, LaTeX formatting artifacts, and lowercasing.
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\\[a-zA-Z]+/g, '') // remove latex commands like \frac, \sqrt
    .replace(/[$_{}^\\~]/g, '')  // remove math symbols
    .replace(/[^\w\s]/g, '')     // remove punctuation
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim();
}

/**
 * Computes deterministic SHA-256 hash of normalized text for instant duplicate detection.
 */
export function computeDuplicateHash(statement: string): string {
  const normalized = normalizeQuestionText(statement);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Computes token-level Jaccard similarity between two texts (0 to 1).
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const tokensA = new Set(normalizeQuestionText(textA).split(' ').filter(Boolean));
  const tokensB = new Set(normalizeQuestionText(textB).split(' ').filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const arrA = Array.from(tokensA);
  const arrB = Array.from(tokensB);
  const intersection = arrA.filter((x) => tokensB.has(x));
  const union = new Set(arrA.concat(arrB));

  return intersection.length / union.size;
}

/**
 * Validates a question against all 7 NEET quality & completeness rules.
 */
export async function validateQuestion(
  input: QuestionValidationInput,
  excludeQuestionId?: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicateHash = computeDuplicateHash(input.statement);

  // 1. Question Completeness Validation
  if (!input.statement || input.statement.trim().length < 15) {
    errors.push('Question statement is too short or missing (minimum 15 characters required).');
  }

  // 2. Four-Option Validation
  const options = [
    input.option1?.trim(),
    input.option2?.trim(),
    input.option3?.trim(),
    input.option4?.trim(),
  ];

  if (options.some((opt) => !opt || opt.length === 0)) {
    errors.push('All four answer options (Option 1, 2, 3, 4) must be non-empty.');
  }

  // Check for duplicate options within the same question
  const uniqueOptions = new Set(options.map((o) => normalizeQuestionText(o)));
  if (uniqueOptions.size < 4) {
    errors.push('All four answer options must be distinct from each other.');
  }

  // 3. Correct-Answer Validation
  if (!input.correctAnswer || input.correctAnswer < 1 || input.correctAnswer > 4) {
    errors.push('Correct answer must be an integer between 1 and 4.');
  }

  // 4. Detailed Explanation Validation
  if (!input.explanation || input.explanation.trim().length < 20) {
    errors.push('Detailed explanation is required (minimum 20 characters) explaining the concept or derivation.');
  }

  // 5. Syllabus Relevance Validation
  if (!input.subjectCode) {
    errors.push('Valid subject (PHYSICS, CHEMISTRY, BOTANY, ZOOLOGY) is required.');
  }
  if (!input.chapterName || input.chapterName.trim().length < 2) {
    errors.push('NCERT syllabus chapter name is required.');
  }

  // 6. Duplicate Detection (Exact Hash & High Similarity)
  const existingHashMatch = await prisma.question.findFirst({
    where: {
      duplicateHash,
      id: excludeQuestionId ? { not: excludeQuestionId } : undefined,
    },
    select: { id: true, statement: true },
  });

  let duplicateQuestionId: string | undefined;
  let similarityScore: number | undefined;

  if (existingHashMatch) {
    errors.push(`Duplicate detected: Identical or normalized match found with existing question ID ${existingHashMatch.id}.`);
    duplicateQuestionId = existingHashMatch.id;
    similarityScore = 1.0;
  } else {
    // Check near-duplicate in same subject
    const subject = await prisma.subject.findUnique({
      where: { code: input.subjectCode },
    });
    if (subject) {
      const recentQuestions = await prisma.question.findMany({
        where: {
          subjectId: subject.id,
          id: excludeQuestionId ? { not: excludeQuestionId } : undefined,
        },
        select: { id: true, statement: true },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      for (const rq of recentQuestions) {
        const sim = calculateJaccardSimilarity(input.statement, rq.statement);
        if (sim > 0.85) {
          warnings.push(`High semantic similarity (${Math.round(sim * 100)}%) with question ID ${rq.id}. Requires manual review.`);
          duplicateQuestionId = rq.id;
          similarityScore = sim;
          break;
        }
      }
    }
  }

  // 7. Difficulty Validation
  const validDifficulties: Difficulty[] = [Difficulty.EASY, Difficulty.MODERATE, Difficulty.DIFFICULT];
  if (input.difficulty && !validDifficulties.includes(input.difficulty)) {
    warnings.push(`Invalid difficulty '${input.difficulty}'. Defaulting to MODERATE.`);
  }

  const isValid = errors.length === 0;
  let status: VerificationStatus = VerificationStatus.VERIFIED;

  if (!isValid) {
    status = VerificationStatus.REJECTED;
  } else if (warnings.length > 0 || input.questionSource === QuestionSource.AI_GENERATED) {
    // AI generated questions must go through reviewer approval before VERIFIED
    status = input.questionSource === QuestionSource.AI_GENERATED
      ? VerificationStatus.PENDING
      : VerificationStatus.NEEDS_REVIEW;
  }

  return {
    isValid,
    status,
    errors,
    warnings,
    duplicateHash,
    duplicateQuestionId,
    similarityScore,
  };
}
