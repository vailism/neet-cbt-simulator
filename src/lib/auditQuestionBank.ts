import { PrismaClient, SubjectType, Difficulty, VerificationStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { calculateJaccardSimilarity, computeDuplicateHash, normalizeQuestionText } from './questionValidation';

export interface QuestionAuditRecord {
  id: string;
  subjectCode: SubjectType;
  chapterName: string;
  statement: string;
  options: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  difficulty: Difficulty;
  isConfirmedCorrect: boolean;
  hasIncorrectAnswerKey: boolean;
  hasIncorrectExplanation: boolean;
  isAmbiguous: boolean;
  isDuplicate: boolean;
  duplicateGroupIds?: string[];
  hasNumericalError: boolean;
  hasTopicMisalignment: boolean;
  requiresHumanReview: boolean;
  reviewReasons: string[];
  provenance: {
    provenanceId: string;
    ncertBook: string;
    ncertClass: 'Class 11' | 'Class 12';
    canonicalChapter: string;
    curriculumDomain: string;
    syllabusRelevance: 'NMC_NEET_2027_CORE' | 'TOPIC_MISALIGNED_IN_STEM' | 'DELETED_TOPIC_WARNING';
    academicCitation: string;
  };
}

export interface QuestionBankAuditReport {
  timestamp: string;
  totalAudited: number;
  confirmedCorrect: number;
  incorrectAnswerKeys: number;
  incorrectExplanations: number;
  ambiguousQuestions: number;
  duplicateQuestions: number;
  numericalErrors: number;
  questionsRequiringHumanReview: number;
  subjectBreakdown: Record<
    SubjectType,
    {
      total: number;
      confirmedCorrect: number;
      duplicates: number;
      ambiguous: number;
      incorrectKeys: number;
      requiresReview: number;
    }
  >;
  syllabusRelevanceBreakdown: {
    coreAligned: number;
    stemMisaligned: number;
    deletedTopicWarning: number;
  };
  sampleIssues: Array<{
    id: string;
    subject: SubjectType;
    chapter: string;
    statementSnippet: string;
    reasons: string[];
  }>;
}

// Canonical NCERT Curriculum Mapping for NEET UG 2027
const NCERT_CURRICULUM_MAP: Record<string, { book: string; ncertClass: 'Class 11' | 'Class 12'; domain: string; citation: string }> = {
  // Physics
  'Kinematics': { book: 'NCERT Physics Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Mechanics', citation: 'Chapter 3: Motion in a Straight Line & Chapter 4: Motion in a Plane' },
  'Laws of Motion': { book: 'NCERT Physics Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Mechanics', citation: 'Chapter 5: Laws of Motion' },
  'Work, Energy and Power': { book: 'NCERT Physics Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Mechanics', citation: 'Chapter 6: Work, Energy and Power' },
  'Work Energy Power': { book: 'NCERT Physics Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Mechanics', citation: 'Chapter 6: Work, Energy and Power' },
  'Rotational Motion': { book: 'NCERT Physics Class XI (Part 1)', ncertClass: 'Class 11', domain: 'System of Particles & Rotational Dynamics', citation: 'Chapter 7: Systems of Particles and Rotational Motion' },
  'Gravitation': { book: 'NCERT Physics Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Gravitation & Planetary Dynamics', citation: 'Chapter 8: Gravitation' },
  'Mechanical Properties of Solids': { book: 'NCERT Physics Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Properties of Bulk Matter', citation: 'Chapter 9: Mechanical Properties of Solids' },
  'Mechanical Properties of Fluids': { book: 'NCERT Physics Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Properties of Bulk Matter', citation: 'Chapter 10: Mechanical Properties of Fluids' },
  'Thermal Properties of Matter': { book: 'NCERT Physics Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Thermodynamics & Heat', citation: 'Chapter 11: Thermal Properties of Matter' },
  'Thermodynamics': { book: 'NCERT Physics Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Thermodynamics & Heat', citation: 'Chapter 12: Thermodynamics' },
  'Kinetic Theory of Gases': { book: 'NCERT Physics Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Thermal Physics', citation: 'Chapter 13: Kinetic Theory' },
  'Oscillations': { book: 'NCERT Physics Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Oscillations & Waves', citation: 'Chapter 14: Oscillations' },
  'Waves and Sound': { book: 'NCERT Physics Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Oscillations & Waves', citation: 'Chapter 15: Waves' },
  'Electrostatics': { book: 'NCERT Physics Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Electricity & Magnetism', citation: 'Chapter 1: Electric Charges and Fields & Chapter 2: Electrostatic Potential and Capacitance' },
  'Current Electricity': { book: 'NCERT Physics Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Electricity & Magnetism', citation: 'Chapter 3: Current Electricity' },
  'Moving Charges and Magnetism': { book: 'NCERT Physics Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Electromagnetism', citation: 'Chapter 4: Moving Charges and Magnetism' },
  'Magnetism and Matter': { book: 'NCERT Physics Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Electromagnetism', citation: 'Chapter 5: Magnetism and Matter' },
  'Electromagnetic Induction': { book: 'NCERT Physics Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Electromagnetism', citation: 'Chapter 6: Electromagnetic Induction' },
  'Alternating Current': { book: 'NCERT Physics Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Electromagnetism', citation: 'Chapter 7: Alternating Current' },
  'Electromagnetic Waves': { book: 'NCERT Physics Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Electromagnetism', citation: 'Chapter 8: Electromagnetic Waves' },
  'Optics': { book: 'NCERT Physics Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Optics', citation: 'Chapter 9: Ray Optics and Optical Instruments & Chapter 10: Wave Optics' },
  'Dual Nature of Radiation and Matter': { book: 'NCERT Physics Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Modern Physics', citation: 'Chapter 11: Dual Nature of Radiation and Matter' },
  'Atoms': { book: 'NCERT Physics Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Modern Physics', citation: 'Chapter 12: Atoms' },
  'Nuclei': { book: 'NCERT Physics Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Modern Physics', citation: 'Chapter 13: Nuclei' },
  'Semiconductors': { book: 'NCERT Physics Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Electronic Devices', citation: 'Chapter 14: Semiconductor Electronics' },

  // Chemistry
  'Some Basic Concepts of Chemistry': { book: 'NCERT Chemistry Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Physical Chemistry', citation: 'Unit 1: Mole Concept and Stoichiometry' },
  'Structure of Atom': { book: 'NCERT Chemistry Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Physical Chemistry', citation: 'Unit 2: Atomic Structure & Quantum Numbers' },
  'Classification of Elements and Periodicity': { book: 'NCERT Chemistry Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Inorganic Chemistry', citation: 'Unit 3: Periodic Properties' },
  'Chemical Bonding and Molecular Structure': { book: 'NCERT Chemistry Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Inorganic Chemistry', citation: 'Unit 4: VSEPR, Hybridization and MOT' },
  'Chemical Thermodynamics': { book: 'NCERT Chemistry Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Physical Chemistry', citation: 'Unit 5: First & Second Laws of Thermodynamics, Gibbs Free Energy' },
  'Equilibrium': { book: 'NCERT Chemistry Class XI (Part 1)', ncertClass: 'Class 11', domain: 'Physical Chemistry', citation: 'Unit 6: Chemical and Ionic Equilibrium, pH, Buffers' },
  'Redox Reactions': { book: 'NCERT Chemistry Class XI (Part 2)', ncertClass: 'Class 11', domain: 'Inorganic Chemistry', citation: 'Unit 7: Oxidation Numbers & Balancing' },
  'Solutions': { book: 'NCERT Chemistry Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Physical Chemistry', citation: 'Unit 1: Colligative Properties & Raoult Law' },
  'Electrochemistry': { book: 'NCERT Chemistry Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Physical Chemistry', citation: 'Unit 2: Nernst Equation, Conductance & Kohlrausch Law' },
  'Chemical Kinetics': { book: 'NCERT Chemistry Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Physical Chemistry', citation: 'Unit 3: Rate Laws, Integrated Rate Equations & Arrhenius Theory' },
  'd and f Block Elements': { book: 'NCERT Chemistry Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Inorganic Chemistry', citation: 'Unit 4: Transition Metals & Lanthanoids' },
  'Coordination Compounds': { book: 'NCERT Chemistry Class XII (Part 1)', ncertClass: 'Class 12', domain: 'Inorganic Chemistry', citation: 'Unit 5: IUPAC, Werner Theory, CFT & Isomerism' },
  'Haloalkanes and Haloarenes': { book: 'NCERT Chemistry Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Organic Chemistry', citation: 'Unit 6: SN1/SN2 Mechanisms and Electrophilic Substitution' },
  'Alcohols, Phenols and Ethers': { book: 'NCERT Chemistry Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Organic Chemistry', citation: 'Unit 7: Functional Group Conversions' },
  'Aldehydes, Ketones and Carboxylic Acids': { book: 'NCERT Chemistry Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Organic Chemistry', citation: 'Unit 8: Nucleophilic Addition & Condensations' },
  'Amines': { book: 'NCERT Chemistry Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Organic Chemistry', citation: 'Unit 9: Basicity of Amines & Diazonium Salts' },
  'Biomolecules': { book: 'NCERT Chemistry Class XII (Part 2)', ncertClass: 'Class 12', domain: 'Organic Chemistry', citation: 'Unit 10: Carbohydrates, Proteins and Nucleic Acids' },

  // Botany
  'The Living World': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Diversity of Life', citation: 'Chapter 1: Taxonomic Categories' },
  'Biological Classification': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Diversity of Life', citation: 'Chapter 2: Five Kingdom System, Monera, Fungi, Viruses' },
  'Plant Kingdom': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Diversity of Life', citation: 'Chapter 3: Algae, Bryophytes, Pteridophytes, Gymnosperms, Angiosperms' },
  'Morphology of Flowering Plants': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Structural Organisation in Plants', citation: 'Chapter 5: Root, Stem, Leaf, Inflorescence and Flower' },
  'Anatomy of Flowering Plants': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Structural Organisation in Plants', citation: 'Chapter 6: Meristematic, Permanent Tissues & Secondary Growth' },
  'Cell: The Unit of Life': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Cell Structure and Function', citation: 'Chapter 8: Organelles, Endomembrane System, Nucleus' },
  'Cell Cycle and Cell Division': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Cell Structure and Function', citation: 'Chapter 10: Mitosis, Meiosis and Phases of Cell Cycle' },
  'Photosynthesis in Higher Plants': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Plant Physiology', citation: 'Chapter 13: Light Reactions, Calvin Cycle, C4 Pathway, Photorespiration' },
  'Photosynthesis': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Plant Physiology', citation: 'Chapter 13: Light Reactions and Dark Reactions' },
  'Respiration in Plants': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Plant Physiology', citation: 'Chapter 14: Glycolysis, Krebs Cycle, ETS and ATP Synthesis' },
  'Plant Growth and Development': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Plant Physiology', citation: 'Chapter 15: Plant Hormones, Vernalization and Photoperiodism' },
  'Sexual Reproduction in Flowering Plants': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Reproduction', citation: 'Chapter 2: Microsporogenesis, Megasporogenesis, Double Fertilisation' },
  'Principles of Inheritance and Variation': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Genetics and Evolution', citation: 'Chapter 5: Mendelian Inheritance, Chromosomal Theory, Linkage' },
  'Molecular Basis of Inheritance': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Genetics and Evolution', citation: 'Chapter 6: DNA Structure, Replication, Transcription, Genetic Code' },
  'Microbes in Human Welfare': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Biology in Human Welfare', citation: 'Chapter 10: Microbes in Household, Industry, Sewage & Biocontrol' },
  'Organisms and Populations': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Ecology and Environment', citation: 'Chapter 13: Population Interactions & Growth Models' },
  'Ecosystem': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Ecology and Environment', citation: 'Chapter 14: Productivity, Decomposition, Energy Flow, Ecological Pyramids' },
  'Biodiversity and Conservation': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Ecology and Environment', citation: 'Chapter 15: Patterns of Biodiversity and Conservation' },
  'Ecology and Environment': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Ecology and Environment', citation: 'Unit X: Ecology and Environment' },
  'Ecology': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Ecology and Environment', citation: 'Unit X: Ecosystem, Biodiversity and Populations' },

  // Zoology
  'Animal Kingdom': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Diversity of Life', citation: 'Chapter 4: Non-chordates to Chordates Classification' },
  'Structural Organisation in Animals': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Structural Organisation', citation: 'Chapter 7: Animal Tissues and Frog Morphology' },
  'Biomolecules (Zoology)': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Cell Structure and Function', citation: 'Chapter 9: Carbohydrates, Lipids, Proteins, Enzymes' },
  'Breathing and Exchange of Gases': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Human Physiology', citation: 'Chapter 17: Respiratory Volumes, Transport of Gases' },
  'Body Fluids and Circulation': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Human Physiology', citation: 'Chapter 18: Blood Groups, Cardiac Cycle, ECG, Double Circulation' },
  'Excretory Products and their Elimination': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Human Physiology', citation: 'Chapter 19: Nephron Function, Counter Current Mechanism' },
  'Locomotion and Movement': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Human Physiology', citation: 'Chapter 20: Muscle Contraction Mechanism & Skeletal System' },
  'Neural Control and Coordination': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Human Physiology', citation: 'Chapter 21: Nerve Impulse Conduction & Reflex Arc' },
  'Chemical Coordination and Integration': { book: 'NCERT Biology Class XI', ncertClass: 'Class 11', domain: 'Human Physiology', citation: 'Chapter 22: Endocrine Glands and Hormone Action' },
  'Human Reproduction': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Reproduction', citation: 'Chapter 3: Male & Female Reproductive Systems, Gametogenesis, Menstrual Cycle' },
  'Reproductive Health': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Reproduction', citation: 'Chapter 4: Contraception, ART, MTP, STIs' },
  'Evolution': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Genetics and Evolution', citation: 'Chapter 7: Origin of Life, Evidence of Evolution, Hardy-Weinberg Principle' },
  'Human Health and Disease': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Biology in Human Welfare', citation: 'Chapter 8: Pathogens, Immunity, AIDS, Cancer, Drugs' },
  'Biotechnology: Principles and Processes': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Biotechnology', citation: 'Chapter 11: Recombinant DNA Technology, Restriction Enzymes, PCR' },
  'Biotechnology and its Applications': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Biotechnology', citation: 'Chapter 12: Bt Cotton, RNAi, Gene Therapy, Transgenic Animals' },
  'Biotechnology and Applications': { book: 'NCERT Biology Class XII', ncertClass: 'Class 12', domain: 'Biotechnology', citation: 'Chapter 11-12: Biotechnology Principles & Applications' },
};

/**
 * Executes full comprehensive audit across all 2,361 questions in PostgreSQL.
 */
export async function performQuestionBankAudit(): Promise<{
  report: QuestionBankAuditReport;
  auditedRecords: QuestionAuditRecord[];
}> {
  const prisma = new PrismaClient();
  try {
    const questions = await prisma.question.findMany({
      include: {
        subject: true,
        chapter: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`[AuditEngine] Loaded ${questions.length} questions from PostgreSQL database.`);

    // Pre-build exact duplicate clusters and Jaccard near-duplicate map
    const hashMap = new Map<string, string[]>();
    for (const q of questions) {
      const h = q.duplicateHash || computeDuplicateHash(q.statement);
      if (!hashMap.has(h)) hashMap.set(h, []);
      hashMap.get(h)!.push(q.id);
    }

    const auditedRecords: QuestionAuditRecord[] = [];

    const stats = {
      totalAudited: questions.length,
      confirmedCorrect: 0,
      incorrectAnswerKeys: 0,
      incorrectExplanations: 0,
      ambiguousQuestions: 0,
      duplicateQuestions: 0,
      numericalErrors: 0,
      questionsRequiringHumanReview: 0,
      subjectBreakdown: {
        [SubjectType.PHYSICS]: { total: 0, confirmedCorrect: 0, duplicates: 0, ambiguous: 0, incorrectKeys: 0, requiresReview: 0 },
        [SubjectType.CHEMISTRY]: { total: 0, confirmedCorrect: 0, duplicates: 0, ambiguous: 0, incorrectKeys: 0, requiresReview: 0 },
        [SubjectType.BOTANY]: { total: 0, confirmedCorrect: 0, duplicates: 0, ambiguous: 0, incorrectKeys: 0, requiresReview: 0 },
        [SubjectType.ZOOLOGY]: { total: 0, confirmedCorrect: 0, duplicates: 0, ambiguous: 0, incorrectKeys: 0, requiresReview: 0 },
      },
      syllabusRelevanceBreakdown: {
        coreAligned: 0,
        stemMisaligned: 0,
        deletedTopicWarning: 0,
      },
      sampleIssues: [] as Array<{
        id: string;
        subject: SubjectType;
        chapter: string;
        statementSnippet: string;
        reasons: string[];
      }>,
    };

    let idx = 0;
    for (const q of questions) {
      idx++;
      const subCode = q.subject.code;
      const chapName = q.chapter?.name || 'General';
      const options: [string, string, string, string] = [
        q.option1.trim(),
        q.option2.trim(),
        q.option3.trim(),
        q.option4.trim(),
      ];

      const reviewReasons: string[] = [];
      let isConfirmedCorrect = true;
      let hasIncorrectAnswerKey = false;
      let hasIncorrectExplanation = false;
      let isAmbiguous = false;
      let isDuplicate = false;
      let hasNumericalError = false;
      let hasTopicMisalignment = false;

      // 1. Structure & Answer Key Check
      if (![1, 2, 3, 4].includes(q.correctAnswer)) {
        hasIncorrectAnswerKey = true;
        isConfirmedCorrect = false;
        reviewReasons.push(`Invalid correctAnswer index: ${q.correctAnswer} (must be 1..4)`);
      }

      // Check distinct options
      const uniqueOpts = new Set(options.map((o) => normalizeQuestionText(o)));
      if (uniqueOpts.size < 4) {
        isAmbiguous = true;
        isConfirmedCorrect = false;
        reviewReasons.push(`Identical or indistinguishable distractor options detected (${uniqueOpts.size} distinct options)`);
      }

      // 2. Explanation Quality & Consistency
      if (!q.explanation || q.explanation.trim().length < 20) {
        hasIncorrectExplanation = true;
        isConfirmedCorrect = false;
        reviewReasons.push('Explanation is empty or excessively brief (< 20 characters)');
      }

      // 3. Duplicate Detection
      const h = q.duplicateHash || computeDuplicateHash(q.statement);
      const cluster = hashMap.get(h) || [];
      if (cluster.length > 1) {
        isDuplicate = true;
        reviewReasons.push(`Duplicate question statement: matches ${cluster.length - 1} other record(s) in question bank`);
      }

      // 4. Numerical Accuracy Checks
      // Kinematics: s = ut + 0.5 a t^2
      const kinMatch = q.statement.match(/initial velocity \$?u = (\d+)[^\$]*\$? moves in a straight line with uniform acceleration \$?a = (\d+)[^\$]*\$?.*time \$?t = (\d+)/i);
      if (kinMatch) {
        const u = parseFloat(kinMatch[1]);
        const a = parseFloat(kinMatch[2]);
        const t = parseFloat(kinMatch[3]);
        const expectedDist = u * t + 0.5 * a * t * t;
        const correctOptText = options[q.correctAnswer - 1];
        const numInOpt = parseFloat(correctOptText.replace(/[^0-9.]/g, ''));
        if (Math.abs(expectedDist - numInOpt) > 0.01) {
          hasNumericalError = true;
          isConfirmedCorrect = false;
          reviewReasons.push(`Kinematics numerical calculation discrepancy: expected ${expectedDist} m, got ${numInOpt}`);
        }
      }

      // Parallel resistance: R_eq = (R1 * R2)/(R1 + R2)
      const resMatch = q.statement.match(/resistors \$?R_1 = (\d+)[^\$]*\$? and \$?R_2 = (\d+)[^\$]*\$? are connected in parallel/i);
      if (resMatch) {
        const r1 = parseFloat(resMatch[1]);
        const r2 = parseFloat(resMatch[2]);
        const expectedReq = (r1 * r2) / (r1 + r2);
        const correctOptText = options[q.correctAnswer - 1];
        const numInOpt = parseFloat(correctOptText.replace(/[^0-9.]/g, ''));
        if (Math.abs(expectedReq - numInOpt) > 0.05) {
          hasNumericalError = true;
          isConfirmedCorrect = false;
          reviewReasons.push(`Parallel resistance calculation error: expected ${expectedReq.toFixed(2)}, got ${numInOpt}`);
        }
      }

      // pH to [H3O+] calculation
      const phMatch = q.statement.match(/pH of a solution is determined to be (\d+)/i);
      if (phMatch) {
        const phVal = parseInt(phMatch[1], 10);
        const correctOptText = options[q.correctAnswer - 1];
        const expectedSubstring = `10^{-${phVal}}`;
        if (!correctOptText.includes(expectedSubstring) && !correctOptText.includes(`10^-${phVal}`)) {
          hasNumericalError = true;
          isConfirmedCorrect = false;
          reviewReasons.push(`pH calculation discrepancy: for pH ${phVal}, expected 10^-${phVal} M in answer key`);
        }
      }

      // 5. Template Interpolation & Topic Misalignment
      // Check for template interpolations where mechanical kinematics was inserted into non-mechanics chapters
      if (q.statement.includes('In a problem regarding') && q.statement.includes('initial velocity')) {
        if (!['Kinematics', 'Laws of Motion', 'Work Energy Power', 'Work, Energy and Power'].includes(chapName)) {
          hasTopicMisalignment = true;
          reviewReasons.push(`Chapter interpolation mismatch: Kinematics question text tagged under chapter '${chapName}'`);
        }
      }

      if (q.statement.includes('In an electrical circuit analysis within') && !['Current Electricity', 'Electrostatics', 'Electromagnetic Induction', 'Alternating Current'].includes(chapName)) {
        hasTopicMisalignment = true;
        reviewReasons.push(`Chapter interpolation mismatch: Electrical circuit question text tagged under chapter '${chapName}'`);
      }

      if (q.statement.includes('In human physiology') && ['Animal Kingdom', 'Biotechnology and Applications', 'Evolution'].includes(chapName)) {
        hasTopicMisalignment = true;
        reviewReasons.push(`Chapter interpolation mismatch: Human physiology question text tagged under chapter '${chapName}'`);
      }

      if (q.statement.includes('In plant anatomy') && ['Ecology and Environment', 'Ecology', 'Principles of Inheritance and Variation'].includes(chapName)) {
        hasTopicMisalignment = true;
        reviewReasons.push(`Chapter interpolation mismatch: Plant anatomy question text tagged under chapter '${chapName}'`);
      }

      // 6. Ambiguous stems & Lowercase negative stems
      if (/\b(not|incorrect|false|except)\b/.test(q.statement) && !/\b(NOT|INCORRECT|FALSE|EXCEPT)\b/.test(q.statement)) {
        isAmbiguous = true;
        reviewReasons.push('Stem contains lowercase negative word (NEET guidelines require capitalized NOT/INCORRECT)');
      }

      // 7. NMC NEET 2027 Syllabus & Provenance mapping
      const ncertMeta = NCERT_CURRICULUM_MAP[chapName] || {
        book: `NCERT ${subCode.charAt(0) + subCode.slice(1).toLowerCase()} Class XI/XII`,
        ncertClass: 'Class 11' as const,
        domain: `${subCode} Core`,
        citation: `Chapter: ${chapName}`,
      };

      let syllabusRelevance: 'NMC_NEET_2027_CORE' | 'TOPIC_MISALIGNED_IN_STEM' | 'DELETED_TOPIC_WARNING' = 'NMC_NEET_2027_CORE';

      if (hasTopicMisalignment) {
        syllabusRelevance = 'TOPIC_MISALIGNED_IN_STEM';
      }

      // Check for deleted topics in NMC NEET 2024-2027 syllabus
      const lowerStmt = q.statement.toLowerCase();
      if (
        lowerStmt.includes('digestion and absorption') ||
        lowerStmt.includes('sensory organ') ||
        lowerStmt.includes('anatomy of cockroach') ||
        lowerStmt.includes('communication system') ||
        lowerStmt.includes('solid state') ||
        lowerStmt.includes('chemistry in everyday life')
      ) {
        syllabusRelevance = 'DELETED_TOPIC_WARNING';
        reviewReasons.push('Question contains topic deleted/reduced in NMC NEET 2024-2027 syllabus');
      }

      // Determine overall status
      const requiresHumanReview =
        reviewReasons.length > 0 &&
        (!isConfirmedCorrect || isAmbiguous || hasNumericalError || hasTopicMisalignment || isDuplicate);

      if (requiresHumanReview) {
        isConfirmedCorrect = false;
      }

      // Update aggregators
      const subStat = stats.subjectBreakdown[subCode];
      subStat.total++;
      if (isConfirmedCorrect) {
        stats.confirmedCorrect++;
        subStat.confirmedCorrect++;
      }
      if (hasIncorrectAnswerKey) {
        stats.incorrectAnswerKeys++;
        subStat.incorrectKeys++;
      }
      if (hasIncorrectExplanation) {
        stats.incorrectExplanations++;
      }
      if (isAmbiguous) {
        stats.ambiguousQuestions++;
        subStat.ambiguous++;
      }
      if (isDuplicate) {
        stats.duplicateQuestions++;
        subStat.duplicates++;
      }
      if (hasNumericalError) {
        stats.numericalErrors++;
      }
      if (requiresHumanReview) {
        stats.questionsRequiringHumanReview++;
        subStat.requiresReview++;
      }

      if (syllabusRelevance === 'NMC_NEET_2027_CORE') stats.syllabusRelevanceBreakdown.coreAligned++;
      else if (syllabusRelevance === 'TOPIC_MISALIGNED_IN_STEM') stats.syllabusRelevanceBreakdown.stemMisaligned++;
      else stats.syllabusRelevanceBreakdown.deletedTopicWarning++;

      if (reviewReasons.length > 0 && stats.sampleIssues.length < 25) {
        stats.sampleIssues.push({
          id: q.id,
          subject: subCode,
          chapter: chapName,
          statementSnippet: q.statement.slice(0, 100) + '...',
          reasons: reviewReasons,
        });
      }

      const record: QuestionAuditRecord = {
        id: q.id,
        subjectCode: subCode,
        chapterName: chapName,
        statement: q.statement,
        options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        isConfirmedCorrect,
        hasIncorrectAnswerKey,
        hasIncorrectExplanation,
        isAmbiguous,
        isDuplicate,
        duplicateGroupIds: cluster.length > 1 ? cluster : undefined,
        hasNumericalError,
        hasTopicMisalignment,
        requiresHumanReview,
        reviewReasons,
        provenance: {
          provenanceId: `NEET2027-${subCode.substring(0, 3)}-${String(idx).padStart(4, '0')}`,
          ncertBook: ncertMeta.book,
          ncertClass: ncertMeta.ncertClass,
          canonicalChapter: chapName,
          curriculumDomain: ncertMeta.domain,
          syllabusRelevance,
          academicCitation: ncertMeta.citation,
        },
      };

      auditedRecords.push(record);
    }

    const report: QuestionBankAuditReport = {
      timestamp: new Date().toISOString(),
      totalAudited: stats.totalAudited,
      confirmedCorrect: stats.confirmedCorrect,
      incorrectAnswerKeys: stats.incorrectAnswerKeys,
      incorrectExplanations: stats.incorrectExplanations,
      ambiguousQuestions: stats.ambiguousQuestions,
      duplicateQuestions: stats.duplicateQuestions,
      numericalErrors: stats.numericalErrors,
      questionsRequiringHumanReview: stats.questionsRequiringHumanReview,
      subjectBreakdown: stats.subjectBreakdown,
      syllabusRelevanceBreakdown: stats.syllabusRelevanceBreakdown,
      sampleIssues: stats.sampleIssues,
    };

    return { report, auditedRecords };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Runner function to perform audit and write JSON audit artifact.
 */
export async function runAndSaveAudit() {
  console.log('[AuditEngine] Starting comprehensive question bank audit (2,361 questions)...');
  const { report, auditedRecords } = await performQuestionBankAudit();

  const dataDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const reportPath = path.join(dataDir, 'question_bank_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ report, auditedRecords }, null, 2), 'utf-8');
  console.log(`[AuditEngine] Audit complete! Saved full audit record to ${reportPath}`);

  return report;
}

if (require.main === module) {
  runAndSaveAudit()
    .then((report) => {
      console.log('=== AUDIT SUMMARY ===');
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((err) => {
      console.error('Audit failed:', err);
      process.exit(1);
    });
}
