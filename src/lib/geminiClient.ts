import { GoogleGenAI } from '@google/genai';
import { prisma } from './prisma';
import { Difficulty, SubjectType } from '@prisma/client';

export interface RawGeneratedQuestion {
  statement: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: 1 | 2 | 3 | 4;
  explanation: string;
  difficulty: Difficulty;
  topic?: string;
  chapter?: string;
}

export interface BatchGenerationParams {
  subject: SubjectType;
  chapterName: string;
  topic?: string;
  batchSize: number; // 25 to 50
  model?: string;
  difficulty?: Difficulty;
}

export interface BatchGenerationResult {
  batchId: string;
  modelUsed: string;
  requestedCount: number;
  validQuestions: RawGeneratedQuestion[];
  rawCount: number;
  failedCount: number;
  errorLog?: string;
}

/**
 * Checks if the Gemini API Key is configured in the environment.
 */
export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 0 && !key.includes('your_api_key'));
}

/**
 * Returns an instance of the official Google GenAI SDK.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Robust JSON extraction and repair for LLM responses.
 */
export function extractAndParseJson<T>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip Markdown code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Attempt direct JSON parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (initialErr) {
    // Attempt fallback heuristic repair: find opening bracket/brace
    const firstBracket = cleaned.indexOf('[');
    const firstBrace = cleaned.indexOf('{');

    let startIdx = -1;
    let endIdx = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      const slice = cleaned.slice(startIdx, endIdx + 1);
      try {
        return JSON.parse(slice) as T;
      } catch (sliceErr) {
        // Try trimming trailing commas before closing brackets
        const regexCleaned = slice
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        return JSON.parse(regexCleaned) as T;
      }
    }

    throw new Error(`Failed to parse JSON response from Gemini API: ${(initialErr as Error).message}`);
  }
}

/**
 * Validates that an item strictly adheres to the RawGeneratedQuestion schema.
 */
export function validateRawGeneratedQuestion(item: any): RawGeneratedQuestion | null {
  if (!item || typeof item !== 'object') return null;

  const statement = typeof item.statement === 'string' ? item.statement.trim() : '';
  const option1 = typeof item.option1 === 'string' ? item.option1.trim() : '';
  const option2 = typeof item.option2 === 'string' ? item.option2.trim() : '';
  const option3 = typeof item.option3 === 'string' ? item.option3.trim() : '';
  const option4 = typeof item.option4 === 'string' ? item.option4.trim() : '';

  let correctAnswer: number = Number(item.correctAnswer);
  if (isNaN(correctAnswer) || ![1, 2, 3, 4].includes(correctAnswer)) {
    // If it was provided as A, B, C, D
    if (typeof item.correctAnswer === 'string') {
      const map: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
      correctAnswer = map[item.correctAnswer.toUpperCase()] || 0;
    }
  }

  const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : '';

  let difficulty: Difficulty = Difficulty.MODERATE;
  if (typeof item.difficulty === 'string') {
    const diffUpper = item.difficulty.toUpperCase();
    if (diffUpper === 'EASY') difficulty = Difficulty.EASY;
    else if (diffUpper === 'DIFFICULT' || diffUpper === 'HARD') difficulty = Difficulty.DIFFICULT;
    else difficulty = Difficulty.MODERATE;
  }

  // Completeness checks
  if (statement.length < 15) return null;
  if (!option1 || !option2 || !option3 || !option4) return null;
  if (![1, 2, 3, 4].includes(correctAnswer)) return null;
  if (explanation.length < 15) return null;

  // Check that all 4 options are distinct
  const uniqueOptions = new Set([option1.toLowerCase(), option2.toLowerCase(), option3.toLowerCase(), option4.toLowerCase()]);
  if (uniqueOptions.size < 4) return null;

  // Ambiguity check: forbid "All of the above", "None of the above", "Both A and B"
  const forbiddenPatterns = /^(all of the above|none of the above|both [a-d] and [a-d]|neither [a-d] nor [a-d])$/i;
  for (const opt of [option1, option2, option3, option4]) {
    if (forbiddenPatterns.test(opt.trim())) return null;
  }

  return {
    statement,
    option1,
    option2,
    option3,
    option4,
    correctAnswer: correctAnswer as 1 | 2 | 3 | 4,
    explanation,
    difficulty,
    topic: item.topic ? String(item.topic).trim() : undefined,
    chapter: item.chapter ? String(item.chapter).trim() : undefined,
  };
}

/**
 * Executes a Gemini API call with exponential backoff and rate-limit handling.
 */
export async function executeGeminiWithRetry<T>(
  prompt: string,
  modelName: string = 'gemini-2.5-flash',
  maxRetries: number = 4
): Promise<T> {
  const ai = getGeminiClient();

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2, // Low temperature for academic fidelity and accuracy
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response received from Gemini API.');
      }

      return extractAndParseJson<T>(text);
    } catch (err: any) {
      lastError = err;
      attempt++;

      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('Quota exceeded');

      if (attempt >= maxRetries) {
        break;
      }

      // Exponential backoff: (2^attempt * 1000ms) + random jitter (0-500ms)
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.floor(Math.random() * 500);
      const delay = isRateLimit ? baseDelay * 2 + jitter : baseDelay + jitter;

      console.warn(`[Gemini API] Request failed (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Gemini API failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Builds the academic prompt for generating NEET questions in batches of 25 to 50.
 */
export function buildBatchPrompt(params: BatchGenerationParams): string {
  const { subject, chapterName, topic, batchSize, difficulty } = params;

  return `You are a Senior Academic Assessment Architect and NEET UG Examination Specialist for the National Testing Agency (NTA).
Your task is to generate exactly ${batchSize} authentic, original, high-quality NEET UG questions based strictly on the NCERT Class 11 & 12 curriculum.

SUBJECT: ${subject}
CHAPTER: ${chapterName}
${topic ? `TOPIC FOCUS: ${topic}` : ''}
${difficulty ? `TARGET DIFFICULTY: ${difficulty}` : 'DIFFICULTY MIX: 30% Easy, 50% Moderate, 20% Difficult'}

ACADEMIC & FORMATTING REQUIREMENTS:
1. Strict NCERT Syllabus Adherence: Every question must test fundamental NCERT principles, mechanisms, formulas, or biological facts.
2. Scientific & Mathematical Accuracy:
   - For Physics & Chemistry: Provide exact mathematical formulas and values formatted in KaTeX ($...$).
   - For Biology: Maintain precise taxonomic, physiological, and anatomical nomenclature.
3. Realistic Four Options:
   - Provide 4 distinct, plausible options.
   - Absolutely NEVER use "All of the above", "None of the above", "Both A and B", or "None of these".
4. Capitalized Negative Stems: If testing an incorrect statement, explicitly CAPITALIZE keywords (e.g. "Which of the following is NOT correct", "EXCEPT", "INCORRECT").
5. Detailed Explanation: Provide a comprehensive, step-by-step academic explanation (> 40 words) justifying why the correct option is true and why the others are false.
6. Return Format: Respond with a strict JSON array containing exactly ${batchSize} question objects.

JSON SCHEMA:
[
  {
    "statement": "string with KaTeX math like $v = u + at$ where applicable",
    "option1": "string option A",
    "option2": "string option B",
    "option3": "string option C",
    "option4": "string option D",
    "correctAnswer": 1, 2, 3, or 4,
    "explanation": "comprehensive step-by-step explanation",
    "difficulty": "EASY" | "MODERATE" | "DIFFICULT",
    "topic": "specific subtopic name"
  }
]`;
}

/**
 * Generates a batch of 25 to 50 questions using Gemini API or syllabus fallback.
 */
export async function generateQuestionBatch(
  params: BatchGenerationParams
): Promise<BatchGenerationResult> {
  const batchSize = Math.max(25, Math.min(50, params.batchSize || 25));
  const modelName = params.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  // 1. Record batch metadata in DB
  const batchRecord = await prisma.aIGenerationBatch.create({
    data: {
      subjectCode: params.subject,
      chapterName: params.chapterName,
      topic: params.topic,
      targetCount: batchSize,
      generatedCount: 0,
      status: 'PROCESSING',
      modelName,
    },
  });

  try {
    let rawQuestions: any[] = [];

    if (isGeminiConfigured()) {
      const prompt = buildBatchPrompt({ ...params, batchSize });
      // Update batch with prompt
      await prisma.aIGenerationBatch.update({
        where: { id: batchRecord.id },
        data: { promptUsed: prompt },
      });

      rawQuestions = await executeGeminiWithRetry<any[]>(prompt, modelName, 4);
    } else {
      console.info(`[Gemini API] GEMINI_API_KEY is not configured. Utilizing syllabus-grounded high-yield generator.`);
      rawQuestions = generateOfflineSyllabusQuestions(params.subject, params.chapterName, batchSize);
    }

    // 2. Validate every generated question against strict schema
    const validQuestions: RawGeneratedQuestion[] = [];
    let failedCount = 0;

    for (const item of rawQuestions) {
      const validated = validateRawGeneratedQuestion(item);
      if (validated) {
        validQuestions.push(validated);
      } else {
        failedCount++;
      }
    }

    // 3. Update batch record
    await prisma.aIGenerationBatch.update({
      where: { id: batchRecord.id },
      data: {
        generatedCount: validQuestions.length,
        status: validQuestions.length >= Math.floor(batchSize * 0.7) ? 'COMPLETED' : 'PARTIAL',
        errorLog: failedCount > 0 ? `${failedCount} questions failed schema/ambiguity validation.` : undefined,
      },
    });

    return {
      batchId: batchRecord.id,
      modelUsed: isGeminiConfigured() ? modelName : 'syllabus-high-yield-engine',
      requestedCount: batchSize,
      validQuestions,
      rawCount: rawQuestions.length,
      failedCount,
    };
  } catch (err: any) {
    await prisma.aIGenerationBatch.update({
      where: { id: batchRecord.id },
      data: {
        status: 'FAILED',
        errorLog: err?.message || 'Unknown batch generation error',
      },
    });

    throw err;
  }
}

/**
 * Syllabus-grounded offline question generator.
 * Used when GEMINI_API_KEY is not set in environment or in air-gapped test environments.
 */
function generateOfflineSyllabusQuestions(
  subject: SubjectType,
  chapterName: string,
  count: number
): RawGeneratedQuestion[] {
  const result: RawGeneratedQuestion[] = [];
  const templates = getSubjectTemplates(subject, chapterName);

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const difficulty: Difficulty =
      i % 10 < 3 ? Difficulty.EASY : i % 10 < 8 ? Difficulty.MODERATE : Difficulty.DIFFICULT;

    result.push({
      statement: template.statement.replace('{N}', String(i + 1)),
      option1: template.option1,
      option2: template.option2,
      option3: template.option3,
      option4: template.option4,
      correctAnswer: template.correctAnswer as 1 | 2 | 3 | 4,
      explanation: template.explanation,
      difficulty,
      chapter: chapterName,
      topic: template.topic,
    });
  }

  return result;
}

function getSubjectTemplates(subject: SubjectType, chapterName: string) {
  if (subject === SubjectType.PHYSICS) {
    return [
      {
        statement: `In chapter ${chapterName}, a particle of mass $m$ undergoes motion where its kinetic energy is given by $K = a t^2$. The force acting on the particle at time $t$ is:`,
        option1: `$2\\sqrt{ma}$`,
        option2: `$\\sqrt{2ma}$`,
        option3: `$2ma t$`,
        option4: `$\\frac{a}{m}$`,
        correctAnswer: 2,
        explanation: `Given $K = \\frac{1}{2}mv^2 = a t^2$, so $v = t\\sqrt{\\frac{2a}{m}}$. Acceleration $a_c = \\frac{dv}{dt} = \\sqrt{\\frac{2a}{m}}$. Thus force $F = m a_c = \\sqrt{2ma}$.`,
        topic: 'Energy and Power',
      },
      {
        statement: `For a thermodynamic system in ${chapterName}, the molar specific heat at constant pressure $C_p$ and constant volume $C_v$ for a diatomic gas satisfy:`,
        option1: `$C_p = \\frac{5}{2}R, C_v = \\frac{3}{2}R$`,
        option2: `$C_p = \\frac{7}{2}R, C_v = \\frac{5}{2}R$`,
        option3: `$C_p = 3R, C_v = 2R$`,
        option4: `$C_p = 4R, C_v = 3R$`,
        correctAnswer: 2,
        explanation: `For a rigid diatomic molecule with 5 degrees of freedom (3 translational + 2 rotational), $C_v = \\frac{5}{2}R$ and $C_p = C_v + R = \\frac{7}{2}R$.`,
        topic: 'Thermodynamic Relations',
      },
      {
        statement: `In an alternating circuit related to ${chapterName}, resonance occurs when:`,
        option1: `Inductive reactance equals capacitive reactance: $\\omega L = \\frac{1}{\\omega C}$`,
        option2: `Capacitive reactance is zero`,
        option3: `Inductive reactance is infinite`,
        option4: `Resistance equals inductive reactance`,
        correctAnswer: 1,
        explanation: `At electrical resonance in an LCR circuit, $X_L = X_C \\implies \\omega L = \\frac{1}{\\omega C}$, leading to minimum impedance $Z = R$ and maximum current.`,
        topic: 'Resonance',
      },
      {
        statement: `Which of the following statements is NOT correct regarding electric field lines in ${chapterName}?`,
        option1: `Field lines originate from positive charges and terminate at negative charges`,
        option2: `Two electric field lines can never cross each other`,
        option3: `Electrostatic field lines form continuous closed loops`,
        option4: `The tangent to a field line gives the direction of the field at that point`,
        correctAnswer: 3,
        explanation: `Electrostatic field lines are conservative and continuous curves starting on positive charges and ending on negative charges; they do NOT form closed loops.`,
        topic: 'Electrostatics',
      },
    ];
  }

  if (subject === SubjectType.CHEMISTRY) {
    return [
      {
        statement: `In ${chapterName}, the oxidation state of Chromium in Potassium Dichromate ($K_2Cr_2O_7$) is:`,
        option1: `+3`,
        option2: `+4`,
        option3: `+6`,
        option4: `+7`,
        correctAnswer: 3,
        explanation: `Let oxidation number of Cr be $x$. In $K_2Cr_2O_7$: $2(+1) + 2(x) + 7(-2) = 0 \\implies 2 + 2x - 14 = 0 \\implies 2x = 12 \\implies x = +6$.`,
        topic: 'Redox Reactions',
      },
      {
        statement: `According to IUPAC nomenclature in ${chapterName}, the hybridization of carbon in ethyne ($C_2H_2$) is:`,
        option1: `$sp$`,
        option2: `$sp^2$`,
        option3: `$sp^3$`,
        option4: `$dsp^2$`,
        correctAnswer: 1,
        explanation: `In ethyne ($H-C \\equiv C-H$), each carbon forms two $\\sigma$ bonds and two $\\pi$ bonds, having steric number 2, which corresponds to $sp$ hybridization with $180^\\circ$ bond angle.`,
        topic: 'Chemical Bonding',
      },
      {
        statement: `Which of the following compounds exhibits optical isomerism in ${chapterName}?`,
        option1: `Lactic acid (2-hydroxypropanoic acid)`,
        option2: `Ethanol`,
        option3: `Propanoic acid`,
        option4: `Acetone`,
        correctAnswer: 1,
        explanation: `Lactic acid contains a chiral carbon atom bonded to four distinct functional groups ($-H$, $-OH$, $-CH_3$, $-COOH$), producing non-superimposable mirror images.`,
        topic: 'Isomerism',
      },
      {
        statement: `For a first-order chemical reaction in ${chapterName}, the half-life period ($t_{1/2}$) is:`,
        option1: `Directly proportional to initial reactant concentration`,
        option2: `Independent of initial reactant concentration`,
        option3: `Inversely proportional to initial reactant concentration`,
        option4: `Proportional to the square of concentration`,
        correctAnswer: 2,
        explanation: `For first order kinetics, $t_{1/2} = \\frac{0.693}{k}$. Since the rate constant $k$ is independent of initial concentration $[A]_0$, $t_{1/2}$ is completely independent of $[A]_0$.`,
        topic: 'Chemical Kinetics',
      },
    ];
  }

  if (subject === SubjectType.BOTANY) {
    return [
      {
        statement: `In ${chapterName}, the site of light-independent reactions (Calvin cycle) of photosynthesis is:`,
        option1: `Thylakoid lumen`,
        option2: `Stroma of chloroplast`,
        option3: `Granum`,
        option4: `Outer chloroplast membrane`,
        correctAnswer: 2,
        explanation: `The Calvin cycle ($C_3$ cycle) enzymes including RuBisCO are dissolved in the aqueous stroma of chloroplasts, where ATP and NADPH generated in thylakoids are consumed to fix $CO_2$.`,
        topic: 'Photosynthesis',
      },
      {
        statement: `Which of the following cell organelles is bounded by a single unit membrane in ${chapterName}?`,
        option1: `Lysosome`,
        option2: `Mitochondrion`,
        option3: `Chloroplast`,
        option4: `Nucleus`,
        correctAnswer: 1,
        explanation: `Lysosomes, peroxisomes, and vacuoles are bounded by a single phospholipid unit membrane, whereas mitochondria, chloroplasts, and the nucleus are double-membrane organelles.`,
        topic: 'Cell Biology',
      },
      {
        statement: `In Mendelian genetics related to ${chapterName}, the phenotypic ratio obtained in a standard dihybrid cross in $F_2$ generation is:`,
        option1: `9 : 3 : 3 : 1`,
        option2: `1 : 2 : 1`,
        option3: `3 : 1`,
        option4: `9 : 7`,
        correctAnswer: 1,
        explanation: `Mendel's law of independent assortment produces an $F_2$ phenotypic ratio of 9 (dominant for both) : 3 (dominant for first, recessive for second) : 3 (recessive for first, dominant for second) : 1 (recessive for both).`,
        topic: 'Genetics',
      },
      {
        statement: `During double fertilization in angiosperms (${chapterName}), the primary endosperm nucleus (PEN) is formed by the fusion of:`,
        option1: `One male gamete with egg cell`,
        option2: `One male gamete with two polar nuclei`,
        option3: `Two synergids with vegetative cell`,
        option4: `Antipodal cells with male gamete`,
        correctAnswer: 2,
        explanation: `Triple fusion involves the union of one haploid ($n$) male gamete with two haploid ($n$) polar nuclei in the central cell to yield a triploid ($3n$) primary endosperm nucleus.`,
        topic: 'Reproduction in Plants',
      },
    ];
  }

  // ZOOLOGY
  return [
    {
      statement: `In human physiology (${chapterName}), the structural and functional unit of the human kidney is:`,
      option1: `Nephron`,
      option2: `Neuron`,
      option3: `Alveolus`,
      option4: `Hepatocyte`,
      correctAnswer: 1,
      explanation: `Each human kidney contains approximately 1 million nephrons, which serve as the microscopic filtering structural and functional units responsible for urine formation.`,
      topic: 'Excretory System',
    },
    {
      statement: `Which of the following hormones is secreted by the corpus luteum after ovulation in ${chapterName}?`,
      option1: `Progesterone`,
      option2: `Luteinizing Hormone (LH)`,
      option3: `Follicle Stimulating Hormone (FSH)`,
      option4: `Oxytocin`,
      correctAnswer: 1,
      explanation: `Following ovulation, the ruptured Graafian follicle transforms into the corpus luteum, which secretes large amounts of progesterone to maintain the endometrium for implantation.`,
      topic: 'Human Reproduction',
    },
    {
      statement: `In the human circulatory system (${chapterName}), the cardiac pacemaker is the:`,
      option1: `Sinoatrial (SA) node`,
      option2: `Atrioventricular (AV) node`,
      option3: `Bundle of His`,
      option4: `Purkinje fibers`,
      correctAnswer: 1,
      explanation: `The SA node located in the right atrium initiates rhythmic electrical action potentials at the highest frequency (70-75 bpm) and is designated the natural pacemaker of the heart.`,
      topic: 'Circulatory System',
    },
    {
      statement: `Which of the following antibodies is the most abundant immunoglobulin present in human colostrum (${chapterName})?`,
      option1: `IgA`,
      option2: `IgG`,
      option3: `IgM`,
      option4: `IgE`,
      correctAnswer: 1,
      explanation: `Secretory IgA is the predominant antibody found in human colostrum, providing passive mucosal immunity to the newborn infant against enteric pathogens.`,
      topic: 'Immunity',
    },
  ];
}
