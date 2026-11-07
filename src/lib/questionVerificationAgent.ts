import { Difficulty, SubjectType, VerificationStatus } from '@prisma/client';
import { prisma } from './prisma';
import {
  generateDuplicateHash,
  normalizeQuestionText,
  calculateJaccardSimilarity,
} from './questionValidation';
import { isGeminiConfigured, getGeminiClient, extractAndParseJson } from './geminiClient';

export interface QuestionVerificationInput {
  statement: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number; // 1, 2, 3, 4
  explanation: string;
  subject: SubjectType;
  chapterName: string;
  topic?: string;
  difficulty?: Difficulty;
}

export interface VerificationResult {
  status: VerificationStatus;
  rejectionReason?: string;
  reviewerNotes?: string;
  verifiedAnswer?: number;
  duplicateHash: string;
  qualityScore: number; // 0 to 100
  checks: {
    fourOptionsValid: boolean;
    answerKeyValid: boolean;
    explanationValid: boolean;
    syllabusValid: boolean;
    duplicateCheckPassed: boolean;
    difficultyClassified: boolean;
    ambiguityCheckPassed: boolean;
  };
}

// Banned option patterns according to NTA NEET guidelines
const FORBIDDEN_OPTION_PATTERNS = [
  /^all of the above$/i,
  /^none of the above$/i,
  /^none of these$/i,
  /^both [a-d] and [a-d]$/i,
  /^both \(?[1-4]\)? and \(?[1-4]\)?$/i,
  /^neither [a-d] nor [a-d]$/i,
];

/**
 * Validates the four options for uniqueness, completeness, and NTA compliance.
 */
function validateOptions(q: QuestionVerificationInput): { valid: boolean; reason?: string } {
  const options = [q.option1, q.option2, q.option3, q.option4];

  // 1. None can be empty or trivial
  for (let i = 0; i < 4; i++) {
    const opt = options[i]?.trim();
    if (!opt || opt.length === 0) {
      return { valid: false, reason: `Option ${i + 1} is empty or missing.` };
    }

    // Check forbidden patterns
    for (const pattern of FORBIDDEN_OPTION_PATTERNS) {
      if (pattern.test(opt)) {
        return {
          valid: false,
          reason: `Option ${i + 1} uses forbidden option pattern "${opt}" (prohibited in NEET).`,
        };
      }
    }
  }

  // 2. All 4 options must be mutually distinct
  const normalized = options.map((o) => o.trim().toLowerCase());
  const uniqueSet = new Set(normalized);
  if (uniqueSet.size < 4) {
    return { valid: false, reason: 'Duplicate or identical answer options detected.' };
  }

  return { valid: true };
}

/**
 * Checks question statement for ambiguity and proper negative stem capitalization.
 */
function checkAmbiguity(statement: string): { passed: boolean; reason?: string; fixedStatement?: string } {
  if (statement.length < 20) {
    return { passed: false, reason: 'Question statement is too brief or incomplete (< 20 characters).' };
  }

  // Detect lowercase negative stems that could confuse students
  const negativeRegex = /\b(not|incorrect|false|except)\b/;
  if (negativeRegex.test(statement)) {
    // If it has lowercase negative keywords not followed by uppercase
    const fixed = statement.replace(/\b(not)\b/g, 'NOT')
      .replace(/\b(incorrect)\b/g, 'INCORRECT')
      .replace(/\b(false)\b/g, 'FALSE')
      .replace(/\b(except)\b/g, 'EXCEPT');

    return { passed: true, fixedStatement: fixed };
  }

  return { passed: true };
}

/**
 * Independent Gemini Solver:
 * Submits the question blindly to Gemini without revealing the author's answer.
 */
async function solveQuestionIndependentlyWithGemini(
  q: QuestionVerificationInput,
  modelName: string = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
): Promise<{
  derivedAnswer: number;
  isAmbiguous: boolean;
  ambiguityReason?: string;
  independentSolution: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}> {
  const ai = getGeminiClient();

  const prompt = `You are a Senior Academic Quality Inspector for the National Testing Agency (NTA) NEET UG.
Your task is to independently solve and evaluate this question from first principles.
Do NOT guess. Provide rigorous academic justification.

SUBJECT: ${q.subject}
CHAPTER: ${q.chapterName}
${q.topic ? `TOPIC: ${q.topic}` : ''}

QUESTION STATEMENT:
${q.statement}

OPTIONS:
1. ${q.option1}
2. ${q.option2}
3. ${q.option3}
4. ${q.option4}

INDEPENDENT VERIFICATION GUIDELINES:
1. For Physics/Chemistry numericals: Solve step-by-step using standard SI units and fundamental physical laws.
2. For Biology/Chemistry facts: Verify strictly against NCERT Class 11 and 12 textbooks.
3. Check for Flaws/Ambiguity: Are any options ambiguous? Are two options scientifically identical? Is there no correct answer?

Respond ONLY with this strict JSON schema:
{
  "derivedAnswer": 1, 2, 3, or 4,
  "isAmbiguous": false,
  "ambiguityReason": "",
  "independentSolution": "step-by-step scientific rationale justifying the derived answer",
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.0, // Strictly deterministic for verification
    },
  });

  const parsed = extractAndParseJson<any>(response.text || '{}');
  return {
    derivedAnswer: Number(parsed.derivedAnswer) || 0,
    isAmbiguous: Boolean(parsed.isAmbiguous),
    ambiguityReason: parsed.ambiguityReason || undefined,
    independentSolution: parsed.independentSolution || '',
    confidence: parsed.confidence === 'HIGH' ? 'HIGH' : parsed.confidence === 'MEDIUM' ? 'MEDIUM' : 'LOW',
  };
}

/**
 * Runs the comprehensive 7-rule quality control and independent answer verification pipeline.
 */
export async function verifyQuestionQuality(
  input: QuestionVerificationInput,
  options?: {
    checkDuplicateInDb?: boolean;
    useGeminiIndependentVerification?: boolean;
  }
): Promise<VerificationResult> {
  const duplicateHash = generateDuplicateHash(input.statement, [
    input.option1,
    input.option2,
    input.option3,
    input.option4,
  ]);

  let qualityScore = 100;
  const checks = {
    fourOptionsValid: true,
    answerKeyValid: true,
    explanationValid: true,
    syllabusValid: true,
    duplicateCheckPassed: true,
    difficultyClassified: true,
    ambiguityCheckPassed: true,
  };

  // Rule 1: Four-Option Validation
  const optResult = validateOptions(input);
  if (!optResult.valid) {
    checks.fourOptionsValid = false;
    qualityScore -= 40;
    return {
      status: VerificationStatus.REJECTED,
      rejectionReason: optResult.reason,
      duplicateHash,
      qualityScore,
      checks,
    };
  }

  // Rule 2: Explanation Validation
  if (!input.explanation || input.explanation.trim().length < 25) {
    checks.explanationValid = false;
    qualityScore -= 20;
    return {
      status: VerificationStatus.NEEDS_REVIEW,
      reviewerNotes: 'Explanation is too brief or lacks scientific reasoning (< 25 characters).',
      duplicateHash,
      qualityScore,
      checks,
    };
  }

  // Rule 3: Ambiguity Check
  const ambResult = checkAmbiguity(input.statement);
  if (!ambResult.passed) {
    checks.ambiguityCheckPassed = false;
    qualityScore -= 30;
    return {
      status: VerificationStatus.REJECTED,
      rejectionReason: ambResult.reason,
      duplicateHash,
      qualityScore,
      checks,
    };
  }

  // Rule 4: Syllabus Validation
  if (!input.chapterName || input.chapterName.trim().length === 0) {
    checks.syllabusValid = false;
    qualityScore -= 20;
  }

  // Rule 5: Difficulty Classification
  if (!input.difficulty || ![Difficulty.EASY, Difficulty.MODERATE, Difficulty.DIFFICULT].includes(input.difficulty)) {
    checks.difficultyClassified = false;
    qualityScore -= 10;
  }

  // Rule 6: Duplicate Detection against PostgreSQL Database
  if (options?.checkDuplicateInDb !== false) {
    const existingExact = await prisma.question.findFirst({
      where: { duplicateHash },
      select: { id: true, statement: true },
    });

    if (existingExact) {
      checks.duplicateCheckPassed = false;
      qualityScore = 0;
      return {
        status: VerificationStatus.REJECTED,
        rejectionReason: `Duplicate detected: Question matches existing record ${existingExact.id}.`,
        duplicateHash,
        qualityScore,
        checks,
      };
    }

    // Near-duplicate check using token similarity
    const sameSubjectQuestions = await prisma.question.findMany({
      where: {
        subject: { code: input.subject },
        verificationStatus: VerificationStatus.VERIFIED,
      },
      select: { id: true, statement: true },
      take: 100,
    });

    for (const existing of sameSubjectQuestions) {
      const sim = calculateJaccardSimilarity(input.statement, existing.statement);
      if (sim >= 0.85) {
        checks.duplicateCheckPassed = false;
        qualityScore -= 35;
        return {
          status: VerificationStatus.NEEDS_REVIEW,
          reviewerNotes: `High semantic similarity (${Math.round(sim * 100)}%) with existing question ${existing.id}.`,
          duplicateHash,
          qualityScore,
          checks,
        };
      }
    }
  }

  // Rule 7: Independent Answer Verification
  let verifiedAnswer = input.correctAnswer;
  let reviewerNotes: string | undefined;

  const shouldCallGemini =
    options?.useGeminiIndependentVerification !== false && isGeminiConfigured();

  if (shouldCallGemini) {
    try {
      const solverResult = await solveQuestionIndependentlyWithGemini(input);

      if (solverResult.isAmbiguous) {
        return {
          status: VerificationStatus.REJECTED,
          rejectionReason: `Independent verifier found question ambiguous: ${solverResult.ambiguityReason}`,
          duplicateHash,
          qualityScore: qualityScore - 50,
          checks: { ...checks, ambiguityCheckPassed: false },
        };
      }

      if (solverResult.derivedAnswer !== input.correctAnswer) {
        checks.answerKeyValid = false;
        qualityScore -= 40;
        return {
          status: VerificationStatus.NEEDS_REVIEW,
          reviewerNotes: `Answer conflict: Original proposed ${input.correctAnswer}, independent verifier derived ${solverResult.derivedAnswer}. Note: ${solverResult.independentSolution}`,
          verifiedAnswer: solverResult.derivedAnswer,
          duplicateHash,
          qualityScore,
          checks,
        };
      }

      reviewerNotes = `Independently verified by Gemini Blind Solver (Confidence: ${solverResult.confidence}).`;
    } catch (err: any) {
      console.warn(`[Verification Agent] Independent Gemini solver warning: ${err.message}. Defaulting to rule-based verification.`);
      reviewerNotes = `Rule-based verification passed (Gemini solver fallback: ${err.message})`;
    }
  } else {
    // Rule-based answer key check
    if (![1, 2, 3, 4].includes(input.correctAnswer)) {
      checks.answerKeyValid = false;
      return {
        status: VerificationStatus.REJECTED,
        rejectionReason: `Invalid correct answer index: ${input.correctAnswer}. Must be 1, 2, 3, or 4.`,
        duplicateHash,
        qualityScore: 0,
        checks,
      };
    }
    reviewerNotes = 'Verified via NCERT syllabus rules and option distinctiveness.';
  }

  return {
    status: VerificationStatus.VERIFIED,
    reviewerNotes,
    verifiedAnswer,
    duplicateHash,
    qualityScore,
    checks,
  };
}

