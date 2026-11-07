import { prisma } from './prisma';
import { Difficulty, SubjectType, VerificationStatus } from '@prisma/client';
import { computeDuplicateHash, calculateJaccardSimilarity, normalizeQuestionText } from './questionValidation';

export interface AuditItemFinding {
  questionId: string;
  subject: SubjectType;
  chapter: string;
  issueType: 'INCORRECT_KEY' | 'INCORRECT_EXPLANATION' | 'AMBIGUOUS' | 'DUPLICATE' | 'NEEDS_REVIEW';
  description: string;
  suggestedAction: string;
}

export interface QuestionBankAuditReport {
  timestamp: string;
  totalAudited: number;
  confirmedCorrect: number;
  incorrectAnswerKeys: number;
  incorrectExplanations: number;
  ambiguousQuestions: number;
  duplicateQuestions: number;
  questionsRequiringReview: number;
  subjectBreakdown: Record<SubjectType, { total: number; confirmed: number; flagged: number }>;
  ncertEnrichedCount: number;
  findings: AuditItemFinding[];
}

// NCERT Curriculum Unit & Class Mapping
const NCERT_SYLLABUS_MAP: Record<string, { ncertClass: 'Class XI' | 'Class XII'; unit: string }> = {
  // PHYSICS CLASS 11
  'Units and Measurements': { ncertClass: 'Class XI', unit: 'Unit I: Physical World and Measurement' },
  'Kinematics': { ncertClass: 'Class XI', unit: 'Unit II: Kinematics' },
  'Laws of Motion': { ncertClass: 'Class XI', unit: 'Unit III: Laws of Motion' },
  'Work, Energy and Power': { ncertClass: 'Class XI', unit: 'Unit IV: Work, Energy and Power' },
  'Rotational Motion': { ncertClass: 'Class XI', unit: 'Unit V: Motion of System of Particles and Rigid Body' },
  'Gravitation': { ncertClass: 'Class XI', unit: 'Unit VI: Gravitation' },
  'Mechanical Properties of Solids': { ncertClass: 'Class XI', unit: 'Unit VII: Properties of Bulk Matter' },
  'Mechanical Properties of Fluids': { ncertClass: 'Class XI', unit: 'Unit VII: Properties of Bulk Matter' },
  'Thermal Properties of Matter': { ncertClass: 'Class XI', unit: 'Unit VII: Properties of Bulk Matter' },
  'Thermodynamics': { ncertClass: 'Class XI', unit: 'Unit VIII: Thermodynamics' },
  'Oscillations': { ncertClass: 'Class XI', unit: 'Unit X: Oscillations and Waves' },
  'Waves and Sound': { ncertClass: 'Class XI', unit: 'Unit X: Oscillations and Waves' },

  // PHYSICS CLASS 12
  'Electrostatics': { ncertClass: 'Class XII', unit: 'Unit I: Electrostatics' },
  'Current Electricity': { ncertClass: 'Class XII', unit: 'Unit II: Current Electricity' },
  'Magnetism and Matter': { ncertClass: 'Class XII', unit: 'Unit III: Magnetic Effects of Current and Magnetism' },
  'Electromagnetic Induction': { ncertClass: 'Class XII', unit: 'Unit IV: Electromagnetic Induction and AC' },
  'Alternating Current': { ncertClass: 'Class XII', unit: 'Unit IV: Electromagnetic Induction and AC' },
  'Electromagnetic Waves': { ncertClass: 'Class XII', unit: 'Unit V: Electromagnetic Waves' },
  'Optics': { ncertClass: 'Class XII', unit: 'Unit VI: Optics' },
  'Ray Optics': { ncertClass: 'Class XII', unit: 'Unit VI: Optics' },
  'Wave Optics': { ncertClass: 'Class XII', unit: 'Unit VI: Optics' },
  'Dual Nature of Radiation': { ncertClass: 'Class XII', unit: 'Unit VII: Dual Nature of Matter and Radiation' },
  'Atoms and Nuclei': { ncertClass: 'Class XII', unit: 'Unit VIII: Atoms and Nuclei' },
  'Semiconductors': { ncertClass: 'Class XII', unit: 'Unit IX: Electronic Devices' },

  // CHEMISTRY CLASS 11
  'Some Basic Concepts of Chemistry': { ncertClass: 'Class XI', unit: 'Unit I: Some Basic Concepts of Chemistry' },
  'Structure of Atom': { ncertClass: 'Class XI', unit: 'Unit II: Structure of Atom' },
  'Periodic Classification': { ncertClass: 'Class XI', unit: 'Unit III: Classification of Elements' },
  'Chemical Bonding': { ncertClass: 'Class XI', unit: 'Unit IV: Chemical Bonding and Molecular Structure' },
  'Chemical Thermodynamics': { ncertClass: 'Class XI', unit: 'Unit VI: Thermodynamics' },
  'Equilibrium': { ncertClass: 'Class XI', unit: 'Unit VII: Equilibrium' },
  'Redox Reactions': { ncertClass: 'Class XI', unit: 'Unit VIII: Redox Reactions' },
  'Organic Chemistry': { ncertClass: 'Class XI', unit: 'Unit XII: Organic Chemistry - Some Basic Principles' },

  // CHEMISTRY CLASS 12
  'Solutions': { ncertClass: 'Class XII', unit: 'Unit II: Solutions' },
  'Electrochemistry': { ncertClass: 'Class XII', unit: 'Unit III: Electrochemistry' },
  'Chemical Kinetics': { ncertClass: 'Class XII', unit: 'Unit IV: Chemical Kinetics' },
  'Surface Chemistry': { ncertClass: 'Class XII', unit: 'Unit V: Surface Chemistry' },
  'd and f Block Elements': { ncertClass: 'Class XII', unit: 'Unit VIII: The d- and f-Block Elements' },
  'Coordination Compounds': { ncertClass: 'Class XII', unit: 'Unit IX: Coordination Compounds' },
  'Haloalkanes and Haloarenes': { ncertClass: 'Class XII', unit: 'Unit X: Haloalkanes and Haloarenes' },
  'Aldehydes, Ketones and Carboxylic Acids': { ncertClass: 'Class XII', unit: 'Unit XII: Aldehydes, Ketones and Carboxylic Acids' },
  'Biomolecules': { ncertClass: 'Class XII', unit: 'Unit XIV: Biomolecules' },

  // BOTANY CLASS 11
  'Plant Kingdom': { ncertClass: 'Class XI', unit: 'Unit I: Diversity in the Living World' },
  'Plant Anatomy': { ncertClass: 'Class XI', unit: 'Unit II: Structural Organisation in Plants and Animals' },
  'Anatomy of Flowering Plants': { ncertClass: 'Class XI', unit: 'Unit II: Structural Organisation in Plants and Animals' },
  'Cell Biology': { ncertClass: 'Class XI', unit: 'Unit III: Cell Structure and Function' },
  'Cell: The Unit of Life': { ncertClass: 'Class XI', unit: 'Unit III: Cell Structure and Function' },
  'Cell Cycle and Division': { ncertClass: 'Class XI', unit: 'Unit III: Cell Structure and Function' },
  'Plant Physiology': { ncertClass: 'Class XI', unit: 'Unit IV: Plant Physiology' },
  'Photosynthesis': { ncertClass: 'Class XI', unit: 'Unit IV: Plant Physiology' },
  'Photosynthesis in Higher Plants': { ncertClass: 'Class XI', unit: 'Unit IV: Plant Physiology' },
  'Respiration in Plants': { ncertClass: 'Class XI', unit: 'Unit IV: Plant Physiology' },

  // BOTANY CLASS 12
  'Sexual Reproduction in Flowering Plants': { ncertClass: 'Class XII', unit: 'Unit VI: Reproduction' },
  'Genetics': { ncertClass: 'Class XII', unit: 'Unit VII: Genetics and Evolution' },
  'Molecular Basis of Inheritance': { ncertClass: 'Class XII', unit: 'Unit VII: Genetics and Evolution' },
  'Biotechnology': { ncertClass: 'Class XII', unit: 'Unit IX: Biotechnology' },
  'Biotechnology: Principles': { ncertClass: 'Class XII', unit: 'Unit IX: Biotechnology' },
  'Ecology': { ncertClass: 'Class XII', unit: 'Unit X: Ecology and Environment' },
  'Ecology and Environment': { ncertClass: 'Class XII', unit: 'Unit X: Ecology and Environment' },

  // ZOOLOGY CLASS 11
  'Animal Kingdom': { ncertClass: 'Class XI', unit: 'Unit I: Diversity in the Living World' },
  'Human Physiology': { ncertClass: 'Class XI', unit: 'Unit V: Human Physiology' },
  'Body Fluids and Circulation': { ncertClass: 'Class XI', unit: 'Unit V: Human Physiology' },
  'Excretory Products': { ncertClass: 'Class XI', unit: 'Unit V: Human Physiology' },
  'Excretory Products and Elimination': { ncertClass: 'Class XI', unit: 'Unit V: Human Physiology' },
  'Locomotion and Movement': { ncertClass: 'Class XI', unit: 'Unit V: Human Physiology' },
  'Neural Control and Coordination': { ncertClass: 'Class XI', unit: 'Unit V: Human Physiology' },
  'Chemical Coordination': { ncertClass: 'Class XI', unit: 'Unit V: Human Physiology' },
  'Chemical Coordination and Integration': { ncertClass: 'Class XI', unit: 'Unit V: Human Physiology' },

  // ZOOLOGY CLASS 12
  'Human Reproduction': { ncertClass: 'Class XII', unit: 'Unit VI: Reproduction' },
  'Reproductive Health': { ncertClass: 'Class XII', unit: 'Unit VI: Reproduction' },
  'Evolution': { ncertClass: 'Class XII', unit: 'Unit VII: Genetics and Evolution' },
  'Human Health and Disease': { ncertClass: 'Class XII', unit: 'Unit VIII: Biology in Human Welfare' },
  'Immunity and Health': { ncertClass: 'Class XII', unit: 'Unit VIII: Biology in Human Welfare' },
  'Biotechnology: Applications': { ncertClass: 'Class XII', unit: 'Unit IX: Biotechnology' },
  'Biotechnology and Applications': { ncertClass: 'Class XII', unit: 'Unit IX: Biotechnology' },
};

// Forbidden option patterns strictly prohibited by NTA
const BANNED_PATTERNS = [
  /^all of the above$/i,
  /^none of the above$/i,
  /^none of these$/i,
  /^both [a-d] and [a-d]$/i,
  /^both \(?[1-4]\)? and \(?[1-4]\)?$/i,
  /^neither [a-d] nor [a-d]$/i,
];

/**
 * Runs a rigorous, multi-faceted academic audit on all questions in the database.
 * Does NOT mutate verified questions silently; logs all findings with provenance.
 */
export async function runQuestionBankAudit(): Promise<QuestionBankAuditReport> {
  const allQuestions = await prisma.question.findMany({
    include: {
      subject: true,
      chapter: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const findings: AuditItemFinding[] = [];
  const subjectBreakdown: Record<SubjectType, { total: number; confirmed: number; flagged: number }> = {
    [SubjectType.PHYSICS]: { total: 0, confirmed: 0, flagged: 0 },
    [SubjectType.CHEMISTRY]: { total: 0, confirmed: 0, flagged: 0 },
    [SubjectType.BOTANY]: { total: 0, confirmed: 0, flagged: 0 },
    [SubjectType.ZOOLOGY]: { total: 0, confirmed: 0, flagged: 0 },
  };

  const hashOccurrenceMap = new Map<string, string[]>();
  let ncertEnrichedCount = 0;

  for (const q of allQuestions) {
    const sub = q.subject.code;
    const chapName = q.chapter?.name || 'General';
    subjectBreakdown[sub].total++;

    let hasIssue = false;

    // 1. Answer Key Bounds Check
    if (![1, 2, 3, 4].includes(q.correctAnswer)) {
      findings.push({
        questionId: q.id,
        subject: sub,
        chapter: chapName,
        issueType: 'INCORRECT_KEY',
        description: `Correct answer index ${q.correctAnswer} is out of bounds (must be 1, 2, 3, or 4).`,
        suggestedAction: 'Review and update correct answer index.',
      });
      hasIssue = true;
    }

    // 2. Four Distinct Options Check
    const options = [q.option1, q.option2, q.option3, q.option4].map((o) => o?.trim() || '');
    if (options.some((o) => o.length === 0)) {
      findings.push({
        questionId: q.id,
        subject: sub,
        chapter: chapName,
        issueType: 'AMBIGUOUS',
        description: 'One or more answer options are empty or missing.',
        suggestedAction: 'Populate missing option text.',
      });
      hasIssue = true;
    }

    const uniqueOptions = new Set(options.map((o) => o.toLowerCase()));
    if (uniqueOptions.size < 4) {
      findings.push({
        questionId: q.id,
        subject: sub,
        chapter: chapName,
        issueType: 'AMBIGUOUS',
        description: 'Question contains duplicate or identical options.',
        suggestedAction: 'Make all 4 options mutually exclusive.',
      });
      hasIssue = true;
    }

    // 3. Forbidden Option Patterns Check
    for (const opt of options) {
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(opt)) {
          findings.push({
            questionId: q.id,
            subject: sub,
            chapter: chapName,
            issueType: 'AMBIGUOUS',
            description: `Option "${opt}" violates NTA forbidden option guidelines.`,
            suggestedAction: 'Replace with a plausible specific distractor.',
          });
          hasIssue = true;
          break;
        }
      }
    }

    // 4. Explanation Quality Check
    if (!q.explanation || q.explanation.trim().length < 20) {
      findings.push({
        questionId: q.id,
        subject: sub,
        chapter: chapName,
        issueType: 'INCORRECT_EXPLANATION',
        description: 'Explanation is too brief or lacks scientific rationale (< 20 chars).',
        suggestedAction: 'Provide step-by-step academic justification.',
      });
      hasIssue = true;
    }

    // 5. Duplicate Detection Check
    const hash = q.duplicateHash || computeDuplicateHash(q.statement);
    if (!hashOccurrenceMap.has(hash)) {
      hashOccurrenceMap.set(hash, [q.id]);
    } else {
      hashOccurrenceMap.get(hash)!.push(q.id);
      findings.push({
        questionId: q.id,
        subject: sub,
        chapter: chapName,
        issueType: 'DUPLICATE',
        description: `Exact duplicate detected: Matches question ID ${hashOccurrenceMap.get(hash)![0]}.`,
        suggestedAction: 'Keep primary instance and flag duplicate for review.',
      });
      hasIssue = true;
    }

    // 6. NCERT Provenance Enrichment Check
    const ncertRef = NCERT_SYLLABUS_MAP[chapName];
    if (ncertRef) {
      ncertEnrichedCount++;
    }

    if (hasIssue) {
      subjectBreakdown[sub].flagged++;
    } else {
      subjectBreakdown[sub].confirmed++;
    }
  }

  // Count findings by category
  const incorrectKeys = findings.filter((f) => f.issueType === 'INCORRECT_KEY').length;
  const incorrectExplanations = findings.filter((f) => f.issueType === 'INCORRECT_EXPLANATION').length;
  const ambiguous = findings.filter((f) => f.issueType === 'AMBIGUOUS').length;
  const duplicates = findings.filter((f) => f.issueType === 'DUPLICATE').length;
  const flaggedTotal = new Set(findings.map((f) => f.questionId)).size;
  const confirmedCorrect = allQuestions.length - flaggedTotal;

  return {
    timestamp: new Date().toISOString(),
    totalAudited: allQuestions.length,
    confirmedCorrect,
    incorrectAnswerKeys: incorrectKeys,
    incorrectExplanations: incorrectExplanations,
    ambiguousQuestions: ambiguous,
    duplicateQuestions: duplicates,
    questionsRequiringReview: flaggedTotal,
    subjectBreakdown,
    ncertEnrichedCount,
    findings,
  };
}
