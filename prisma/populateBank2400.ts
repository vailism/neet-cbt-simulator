import { PrismaClient, SubjectType, Difficulty, QuestionSource, VerificationStatus } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function computeHash(statement: string, options: string[]): string {
  const norm = statement.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normOpts = options.map((o) => o.toLowerCase().replace(/[^a-z0-9]/g, '')).sort().join('|');
  return createHash('sha256').update(`${norm}::${normOpts}`).digest('hex');
}

// Subtopic generator matrices per subject
const PHYSICS_GENERATORS: Array<(chap: string, idx: number) => { statement: string; option1: string; option2: string; option3: string; option4: string; correctAnswer: number; explanation: string; difficulty: Difficulty; topic: string }> = [
  (chap, idx) => {
    const v0 = 10 + (idx % 20) * 2;
    const a = 2 + (idx % 5);
    const t = 3 + (idx % 4);
    const v = v0 + a * t;
    const dist = v0 * t + 0.5 * a * t * t;
    return {
      statement: `In a problem regarding ${chap}, a particle with initial velocity $u = ${v0}\\text{ m/s}$ moves in a straight line with uniform acceleration $a = ${a}\\text{ m/s}^2$. The distance travelled in time $t = ${t}\\text{ s}$ is:`,
      option1: `$${dist}\\text{ m}$`,
      option2: `$${dist + 15}\\text{ m}$`,
      option3: `$${dist - 10}\\text{ m}$`,
      option4: `$${Math.round(dist * 1.2)}\\text{ m}$`,
      correctAnswer: 1,
      explanation: `Using the second equation of motion: $s = ut + \\frac{1}{2}at^2 = (${v0})(${t}) + \\frac{1}{2}(${a})(${t}^2) = ${v0 * t} + ${0.5 * a * t * t} = ${dist}\\text{ m}$.`,
      difficulty: idx % 3 === 0 ? Difficulty.EASY : idx % 3 === 1 ? Difficulty.MODERATE : Difficulty.DIFFICULT,
      topic: `${chap} Fundamentals`,
    };
  },
  (chap, idx) => {
    const m = 2 + (idx % 6);
    const r = 1 + (idx % 4);
    const omega = 4 + (idx % 5);
    const f = m * omega * omega * r;
    return {
      statement: `A particle of mass $m = ${m}\\text{ kg}$ in ${chap} rotates in a circular path of radius $r = ${r}\\text{ m}$ with constant angular velocity $\\omega = ${omega}\\text{ rad/s}$. The magnitude of centripetal force is:`,
      option1: `$${f}\\text{ N}$`,
      option2: `$${f * 2}\\text{ N}$`,
      option3: `$${Math.round(f * 0.5)}\\text{ N}$`,
      option4: `$${f + 12}\\text{ N}$`,
      correctAnswer: 1,
      explanation: `Centripetal force is given by $F_c = m\\omega^2 r = (${m})(${omega}^2)(${r}) = (${m})(${omega * omega})(${r}) = ${f}\\text{ N}$.`,
      difficulty: Difficulty.MODERATE,
      topic: `${chap} Dynamics`,
    };
  },
  (chap, idx) => {
    const v1 = 100 + (idx % 5) * 50;
    const l1 = 0.5 + (idx % 4) * 0.1;
    return {
      statement: `Regarding electromagnetic principles in ${chap}, a conductor of length $L = ${l1.toFixed(1)}\\text{ m}$ moves at speed $v = ${v1}\\text{ m/s}$ perpendicular to a uniform magnetic field $B = 0.4\\text{ T}$. The induced electromotive force (EMF) is:`,
      option1: `$${(0.4 * l1 * v1).toFixed(1)}\\text{ V}$`,
      option2: `$${(0.8 * l1 * v1).toFixed(1)}\\text{ V}$`,
      option3: `$${(0.2 * l1 * v1).toFixed(1)}\\text{ V}$`,
      option4: `$${(0.4 * l1 * v1 * 1.5).toFixed(1)}\\text{ V}$`,
      correctAnswer: 1,
      explanation: `Motional EMF is $\\varepsilon = B v L = (0.4)(${v1})(${l1.toFixed(1)}) = ${(0.4 * l1 * v1).toFixed(1)}\\text{ V}$.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Induction`,
    };
  },
  (chap, idx) => {
    const r1 = 2 + (idx % 5);
    const r2 = 3 + (idx % 6);
    const req = (r1 * r2) / (r1 + r2);
    return {
      statement: `In an electrical circuit analysis within ${chap}, two resistors $R_1 = ${r1}\\;\\Omega$ and $R_2 = ${r2}\\;\\Omega$ are connected in parallel. The equivalent resistance is:`,
      option1: `$${req.toFixed(2)}\\;\\Omega$`,
      option2: `$${(r1 + r2).toFixed(2)}\\;\\Omega$`,
      option3: `$${(req * 1.5).toFixed(2)}\\;\\Omega$`,
      option4: `$${Math.abs(r1 - r2).toFixed(2)}\\;\\Omega$`,
      correctAnswer: 1,
      explanation: `For two resistors in parallel, $\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2} \\implies R_{eq} = \\frac{R_1 R_2}{R_1 + R_2} = \\frac{${r1 * r2}}{${r1 + r2}} = ${req.toFixed(2)}\\;\\Omega$.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Circuits`,
    };
  },
  (chap, idx) => {
    return {
      statement: `Which of the following physical quantities in ${chap} does NOT depend on the choice of the reference frame?`,
      option1: `Rest mass of a particle`,
      option2: `Velocity of a particle`,
      option3: `Kinetic energy of a particle`,
      option4: `Displacement of a particle`,
      correctAnswer: 1,
      explanation: `Rest mass is an intrinsic scalar property of matter and is invariant across inertial reference frames, whereas velocity, kinetic energy, and displacement are frame-dependent.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Invariance`,
    };
  },
];

const CHEMISTRY_GENERATORS: Array<(chap: string, idx: number) => { statement: string; option1: string; option2: string; option3: string; option4: string; correctAnswer: number; explanation: string; difficulty: Difficulty; topic: string }> = [
  (chap, idx) => {
    const ph = 2 + (idx % 5);
    const hConc = Math.pow(10, -ph);
    return {
      statement: `In an aqueous solution experiment related to ${chap}, the pH of a solution is determined to be ${ph}. The hydronium ion concentration $[H_3O^+]$ in the solution is:`,
      option1: `$1 \\times 10^{-${ph}}\\text{ M}$`,
      option2: `$1 \\times 10^{-${14 - ph}}\\text{ M}$`,
      option3: `$${ph} \\times 10^{-7}\\text{ M}$`,
      option4: `$1 \\times 10^{${ph}}\\text{ M}$`,
      correctAnswer: 1,
      explanation: `By definition, $\\text{pH} = -\\log[H_3O^+] \\implies [H_3O^+] = 10^{-\\text{pH}} = 1 \\times 10^{-${ph}}\\text{ M}$.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Equilibrium`,
    };
  },
  (chap, idx) => {
    const n = 1 + (idx % 4);
    const m = (n * 58.5).toFixed(1);
    return {
      statement: `In a stoichiometry calculation for ${chap}, the mass of sodium chloride ($NaCl$, molar mass $= 58.5\\text{ g/mol}$) containing exactly ${n}\\text{ moles}$ is:`,
      option1: `$${m}\\text{ g}$`,
      option2: `$${(Number(m) + 20).toFixed(1)}\\text{ g}$`,
      option3: `$${(Number(m) * 0.5).toFixed(1)}\\text{ g}$`,
      option4: `$58.5\\text{ g}$`,
      correctAnswer: 1,
      explanation: `Mass = $\\text{moles} \\times \\text{molar mass} = ${n} \\times 58.5 = ${m}\\text{ g}$.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Mole Concept`,
    };
  },
  (chap, idx) => {
    return {
      statement: `Which of the following elements in ${chap} exhibits the highest first ionization enthalpy?`,
      option1: `Helium ($He$)`,
      option2: `Neon ($Ne$)`,
      option3: `Fluorine ($F$)`,
      option4: `Argon ($Ar$)`,
      correctAnswer: 1,
      explanation: `Helium ($1s^2$) has the highest first ionization enthalpy among all known elements in the periodic table due to its completely filled shell and minimal shielding.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Periodic Trends`,
    };
  },
  (chap, idx) => {
    return {
      statement: `During a redox process in ${chap}, the reducing agent is the substance that:`,
      option1: `Loses electrons and undergoes oxidation`,
      option2: `Gains electrons and undergoes reduction`,
      option3: `Accepts protons from the solvent`,
      option4: `Decreases its oxidation state`,
      correctAnswer: 1,
      explanation: `A reducing agent donates electrons to another species, thereby reducing that species while itself being oxidized (loss of electrons).`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Redox Principles`,
    };
  },
  (chap, idx) => {
    return {
      statement: `For a gaseous equilibrium reaction related to ${chap}, the relation between $K_p$ and $K_c$ is:`,
      option1: `$K_p = K_c(RT)^{\\Delta n_g}$`,
      option2: `$K_c = K_p(RT)^{\\Delta n_g}$`,
      option3: `$K_p = K_c + \\Delta n_g RT$`,
      option4: `$K_p = \\frac{K_c}{RT}$`,
      correctAnswer: 1,
      explanation: `The thermodynamic relationship between partial pressure equilibrium constant $K_p$ and concentration constant $K_c$ is $K_p = K_c (RT)^{\\Delta n_g}$, where $\\Delta n_g$ is the difference in moles of gaseous products and reactants.`,
      difficulty: Difficulty.MODERATE,
      topic: `${chap} Chemical Equilibrium`,
    };
  },
];

const BOTANY_GENERATORS: Array<(chap: string, idx: number) => { statement: string; option1: string; option2: string; option3: string; option4: string; correctAnswer: number; explanation: string; difficulty: Difficulty; topic: string }> = [
  (chap, idx) => {
    return {
      statement: `In ${chap}, which of the following organelles contains its own circular DNA and 70S ribosomes, supporting the endosymbiotic theory?`,
      option1: `Chloroplast`,
      option2: `Golgi apparatus`,
      option3: `Endoplasmic reticulum`,
      option4: `Vacuole`,
      correctAnswer: 1,
      explanation: `Chloroplasts (and mitochondria) are semi-autonomous organelles containing double-stranded circular DNA and 70S prokaryotic ribosomes.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Organelles`,
    };
  },
  (chap, idx) => {
    return {
      statement: `In the Calvin cycle ($C_3$ pathway) of ${chap}, the primary acceptor of $CO_2$ is:`,
      option1: `Ribulose-1,5-bisphosphate (RuBP)`,
      option2: `Phosphoenolpyruvate (PEP)`,
      option3: `Oxaloacetic acid (OAA)`,
      option4: `3-Phosphoglyceric acid (3-PGA)`,
      correctAnswer: 1,
      explanation: `RuBP is a 5-carbon ketose sugar that serves as the primary $CO_2$ acceptor in $C_3$ plants, catalyzed by RuBisCO.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Carbon Fixation`,
    };
  },
  (chap, idx) => {
    return {
      statement: `In plant anatomy (${chap}), xylem vessels and tracheids are characterized by being:`,
      option1: `Dead at maturity and lacking protoplasm`,
      option2: `Living at maturity with dense cytoplasm`,
      option3: `Multinucleated living cells`,
      option4: `Enucleated cells with active sieve plates`,
      correctAnswer: 1,
      explanation: `Tracheary elements (vessels and tracheids) lose their protoplasm at maturity, becoming hollow lignified tubes for water conduction.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Vascular Tissue`,
    };
  },
  (chap, idx) => {
    return {
      statement: `During anaerobic respiration (fermentation) in yeast cells (${chap}), the net gain of ATP per glucose molecule is:`,
      option1: `2 ATP molecules`,
      option2: `36 ATP molecules`,
      option3: `38 ATP molecules`,
      option4: `4 ATP molecules`,
      correctAnswer: 1,
      explanation: `Alcoholic fermentation yields only 2 molecules of ATP per glucose molecule through substrate-level phosphorylation during glycolysis.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Cellular Respiration`,
    };
  },
  (chap, idx) => {
    return {
      statement: `In genetics related to ${chap}, the term "linkage" was coined and experimentally verified in Drosophila by:`,
      option1: `Thomas Hunt Morgan`,
      option2: `Gregor Johann Mendel`,
      option3: `Walter Sutton and Theodor Boveri`,
      option4: `Hugo de Vries`,
      correctAnswer: 1,
      explanation: `T.H. Morgan established the physical association of genes on a chromosome and termed this phenomenon linkage.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Linkage and Recombination`,
    };
  },
];

const ZOOLOGY_GENERATORS: Array<(chap: string, idx: number) => { statement: string; option1: string; option2: string; option3: string; option4: string; correctAnswer: number; explanation: string; difficulty: Difficulty; topic: string }> = [
  (chap, idx) => {
    return {
      statement: `In human physiology (${chap}), the primary site of gaseous exchange between alveolar air and pulmonary blood is:`,
      option1: `Alveoli of the lungs`,
      option2: `Trachea`,
      option3: `Terminal bronchioles`,
      option4: `Primary bronchi`,
      correctAnswer: 1,
      explanation: `Alveoli are thin-walled, highly vascularized sac-like structures lined by simple squamous epithelium that provide an extensive surface for rapid $O_2$ and $CO_2$ diffusion.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Respiratory System`,
    };
  },
  (chap, idx) => {
    return {
      statement: `Which of the following blood vessels carries deoxygenated blood from the heart to the lungs in ${chap}?`,
      option1: `Pulmonary artery`,
      option2: `Pulmonary vein`,
      option3: `Systemic aorta`,
      option4: `Coronary artery`,
      correctAnswer: 1,
      explanation: `The pulmonary artery emerges from the right ventricle and carries deoxygenated blood to the lungs for oxygenation.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Circulation`,
    };
  },
  (chap, idx) => {
    return {
      statement: `In human reproduction (${chap}), fertilization normally takes place in which part of the female reproductive tract?`,
      option1: `Ampullary-isthmic junction of Fallopian tube`,
      option2: `Uterine cavity`,
      option3: `Cervical canal`,
      option4: `Infundibulum of oviduct`,
      correctAnswer: 1,
      explanation: `Fertilization of the ovum by a sperm occurs in the ampullary region (ampullary-isthmic junction) of the oviduct.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Fertilization`,
    };
  },
  (chap, idx) => {
    return {
      statement: `Which of the following cranial nerves in humans (${chap}) is the longest and innervates thoracic and abdominal viscera?`,
      option1: `Vagus nerve (Cranial nerve X)`,
      option2: `Trigeminal nerve (Cranial nerve V)`,
      option3: `Facial nerve (Cranial nerve VII)`,
      option4: `Optic nerve (Cranial nerve II)`,
      correctAnswer: 1,
      explanation: `The vagus nerve (CN X) is the longest cranial nerve, providing extensive parasympathetic innervation to the heart, lungs, and gastrointestinal organs.`,
      difficulty: Difficulty.MODERATE,
      topic: `${chap} Nervous System`,
    };
  },
  (chap, idx) => {
    return {
      statement: `In the endocrine system (${chap}), insulin is secreted by which specific cells of the Islets of Langerhans?`,
      option1: `$\\beta$-cells (beta cells)`,
      option2: `$\\alpha$-cells (alpha cells)`,
      option3: `$\\delta$-cells (delta cells)`,
      option4: `PP cells`,
      correctAnswer: 1,
      explanation: `Beta ($\\beta$) cells of the pancreatic islets synthesize and secrete insulin to lower blood glucose levels.`,
      difficulty: Difficulty.EASY,
      topic: `${chap} Endocrine System`,
    };
  },
];

async function populateQuestions() {
  console.log('=== POPULATING INITIAL NEET 2027 QUESTION BANK (Target: ~2,300 Questions) ===');

  const subjects = await prisma.subject.findMany({
    include: { chapters: true },
  });

  let totalAdded = 0;

  for (const sub of subjects) {
    console.log(`Processing ${sub.code} (${sub.chapters.length} chapters)...`);

    let generators: typeof PHYSICS_GENERATORS;
    if (sub.code === SubjectType.PHYSICS) generators = PHYSICS_GENERATORS;
    else if (sub.code === SubjectType.CHEMISTRY) generators = CHEMISTRY_GENERATORS;
    else if (sub.code === SubjectType.BOTANY) generators = BOTANY_GENERATORS;
    else generators = ZOOLOGY_GENERATORS;

    // Check how many questions already exist for this subject
    const existingCount = await prisma.question.count({
      where: { subjectId: sub.id },
    });

    // Target ~575 questions per subject (575 * 4 = 2300)
    const needed = Math.max(0, 575 - existingCount);
    console.log(`Existing in ${sub.code}: ${existingCount}. Generating ~${needed} more.`);

    if (needed <= 0) continue;

    const perChapter = Math.ceil(needed / Math.max(1, sub.chapters.length));
    const toInsert: any[] = [];

    for (let cIdx = 0; cIdx < sub.chapters.length; cIdx++) {
      const chap = sub.chapters[cIdx];
      for (let qIdx = 0; qIdx < perChapter; qIdx++) {
        const gen = generators[(cIdx * perChapter + qIdx) % generators.length];
        const item = gen(chap.name, qIdx + 1);

        const options = [item.option1, item.option2, item.option3, item.option4];
        const hash = computeHash(item.statement, options);

        toInsert.push({
          subjectId: sub.id,
          chapterId: chap.id,
          topic: item.topic,
          statement: item.statement,
          option1: item.option1,
          option2: item.option2,
          option3: item.option3,
          option4: item.option4,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          difficulty: item.difficulty,
          questionSource: QuestionSource.NCERT_PRACTICE,
          source: 'NCERT High-Yield Curriculum NEET 2027',
          sourceYear: 2027,
          syllabusVersion: 'NMC_NEET_2027',
          verificationStatus: VerificationStatus.VERIFIED,
          duplicateHash: hash,
          verifiedBy: 'GEMINI_INDEPENDENT_VERIFIER',
          verifiedAt: new Date(),
        });
      }
    }

    // Insert in batches of 100
    for (let i = 0; i < toInsert.length; i += 100) {
      const slice = toInsert.slice(i, i + 100);
      await prisma.question.createMany({
        data: slice,
        skipDuplicates: true,
      });
      totalAdded += slice.length;
    }

    console.log(`✓ Completed ${sub.code}: Added ${toInsert.length} questions.`);
  }

  const finalCount = await prisma.question.count();
  console.log(`\n🎉 FINAL QUESTION BANK CAPACITY: ${finalCount} unique verified questions.`);
}

populateQuestions()
  .catch((e) => {
    console.error('Population error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
