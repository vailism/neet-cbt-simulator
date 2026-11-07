import { prisma } from './prisma';
import { Difficulty, QuestionSource, SubjectType, VerificationStatus } from '@prisma/client';
import { generateDuplicateHash } from './questionValidation';

export interface PopulatorOptions {
  targetTotal?: number; // Target 2200 - 2500
  onProgress?: (count: number, total: number) => void;
}

/**
 * Returns chapter-specific question definitions for high-yield NCERT NEET UG concepts.
 */
export function getNCERTChapterData() {
  return [
    // PHYSICS
    {
      subject: SubjectType.PHYSICS,
      chapterName: 'Kinematics',
      items: [
        {
          statement: 'A projectile is fired at an angle $\\theta$ with the horizontal with initial speed $u$. The radius of curvature of its trajectory at the highest point is:',
          option1: '$\\frac{u^2 \\cos^2\\theta}{g}$',
          option2: '$\\frac{u^2}{g}$',
          option3: '$\\frac{u^2 \\sin^2\\theta}{g}$',
          option4: '$\\frac{u^2 \\cos\\theta}{g}$',
          correctAnswer: 1,
          explanation: 'At the highest point of projectile motion, the velocity is purely horizontal: $v = u \\cos\\theta$. The normal acceleration is $a_n = g$. Thus radius of curvature $R = \\frac{v^2}{a_n} = \\frac{u^2 \\cos^2\\theta}{g}$.',
          difficulty: Difficulty.MODERATE,
          topic: 'Projectile Motion',
        },
        {
          statement: 'The displacement $x$ of a particle moving along a straight line varies with time $t$ as $x = a t^3 + b t^2 + c t + d$. The acceleration of the particle is zero at time $t$ equal to:',
          option1: '$-\\frac{b}{3a}$',
          option2: '$-\\frac{b}{2a}$',
          option3: '$\\frac{c}{3a}$',
          option4: '$-\\frac{2b}{a}$',
          correctAnswer: 1,
          explanation: 'Velocity $v = \\frac{dx}{dt} = 3at^2 + 2bt + c$. Acceleration $a = \\frac{dv}{dt} = 6at + 2b$. Setting acceleration to zero: $6at + 2b = 0 \\implies t = -\\frac{b}{3a}$.',
          difficulty: Difficulty.EASY,
          topic: 'Instantaneous Acceleration',
        },
        {
          statement: 'A car accelerates from rest at a constant rate $\\alpha$ for some time, after which it decelerates at a constant rate $\\beta$ to come to rest. If the total time elapsed is $T$, the maximum velocity attained by the car is:',
          option1: '$\\frac{\\alpha \\beta T}{\\alpha + \\beta}$',
          option2: '$\\frac{(\\alpha + \\beta)T}{\\alpha \\beta}$',
          option3: '$\\frac{\\alpha^2 T}{\\alpha + \\beta}$',
          option4: '$\\frac{\\beta^2 T}{\\alpha + \\beta}$',
          correctAnswer: 1,
          explanation: 'Let $t_1$ be acceleration time and $t_2$ be deceleration time. $v_{max} = \\alpha t_1 = \\beta t_2$. Since $t_1 + t_2 = T$, $t_1 = \\frac{\\beta T}{\\alpha + \\beta}$. Therefore, $v_{max} = \\alpha t_1 = \\frac{\\alpha \\beta T}{\\alpha + \\beta}$.',
          difficulty: Difficulty.MODERATE,
          topic: 'Rectilinear Motion',
        },
      ],
    },
    {
      subject: SubjectType.PHYSICS,
      chapterName: 'Laws of Motion',
      items: [
        {
          statement: 'A block of mass $m$ is placed on a rough horizontal surface having coefficient of friction $\\mu$. The minimum force required to just slide the block on the surface is:',
          option1: '$\\frac{\\mu mg}{\\sqrt{1 + \\mu^2}}$',
          option2: '$\\mu mg$',
          option3: '$\\frac{mg}{\\sqrt{1 + \\mu^2}}$',
          option4: '$\\frac{\\mu mg}{1 + \\mu^2}$',
          correctAnswer: 1,
          explanation: 'When pulling at an angle $\\theta$ to the horizontal, $F = \\frac{\\mu mg}{\\cos\\theta + \\mu \\sin\\theta}$. To minimize $F$, $\\tan\\theta = \\mu$, giving minimum force $F_{min} = \\frac{\\mu mg}{\\sqrt{1 + \\mu^2}}$.',
          difficulty: Difficulty.DIFFICULT,
          topic: 'Friction',
        },
        {
          statement: 'A rocket of mass $1000\\text{ kg}$ is fired vertically upwards. The exhaust speed is $500\\text{ m/s}$. To give the rocket an initial upward acceleration of $20\\text{ m/s}^2$, the rate of gas ejection should be ($g = 10\\text{ m/s}^2$):',
          option1: '$60\\text{ kg/s}$',
          option2: '$40\\text{ kg/s}$',
          option3: '$50\\text{ kg/s}$',
          option4: '$20\\text{ kg/s}$',
          correctAnswer: 1,
          explanation: 'Thrust force $F_{thrust} = v_{rel} \\frac{dm}{dt}$. Equation of motion: $F_{thrust} - mg = ma \\implies v_{rel}\\frac{dm}{dt} = m(g + a) = 1000(10 + 20) = 30000\\text{ N}$. Thus $\\frac{dm}{dt} = \\frac{30000}{500} = 60\\text{ kg/s}$.',
          difficulty: Difficulty.MODERATE,
          topic: 'Variable Mass Systems',
        },
      ],
    },
    // CHEMISTRY
    {
      subject: SubjectType.CHEMISTRY,
      chapterName: 'Chemical Bonding',
      items: [
        {
          statement: 'According to Valence Shell Electron Pair Repulsion (VSEPR) theory, the geometry and hybridisation of $XeF_4$ are respectively:',
          option1: 'Square planar, $sp^3d^2$',
          option2: 'Tetrahedral, $sp^3$',
          option3: 'Octahedral, $sp^3d^2$',
          option4: 'See-saw, $sp^3d$',
          correctAnswer: 1,
          explanation: '$XeF_4$ has 8 valence electrons from Xe + 4 from F = 12 electrons (6 pairs: 4 bond pairs + 2 lone pairs). Steric number = 6 corresponds to $sp^3d^2$ hybridization with octahedral electron geometry and square planar molecular shape.',
          difficulty: Difficulty.MODERATE,
          topic: 'VSEPR Theory',
        },
        {
          statement: 'Which of the following diatomic molecules is paramagnetic according to Molecular Orbital Theory (MOT)?',
          option1: '$O_2$',
          option2: '$N_2$',
          option3: '$C_2$',
          option4: '$F_2$',
          correctAnswer: 1,
          explanation: 'Oxygen molecule ($O_2$) has 16 electrons. Its electronic configuration in MOT has two unpaired electrons in the degenerate antibonding $\\pi^* 2p_x$ and $\\pi^* 2p_y$ orbitals, rendering it paramagnetic.',
          difficulty: Difficulty.EASY,
          topic: 'Molecular Orbital Theory',
        },
      ],
    },
    // BOTANY
    {
      subject: SubjectType.BOTANY,
      chapterName: 'Cell Biology',
      items: [
        {
          statement: 'Which of the following cellular structures is the primary site of synthesis of lipids and steroidal hormones in animal cells?',
          option1: 'Smooth Endoplasmic Reticulum (SER)',
          option2: 'Rough Endoplasmic Reticulum (RER)',
          option3: 'Golgi Apparatus',
          option4: 'Peroxisome',
          correctAnswer: 1,
          explanation: 'According to NCERT, the Smooth Endoplasmic Reticulum (SER) lacks ribosomes and is the major site for synthesis of lipids and lipid-like steroidal hormones.',
          difficulty: Difficulty.EASY,
          topic: 'Endoplasmic Reticulum',
        },
        {
          statement: 'During which phase of meiotic cell division does the crossing over and genetic recombination between non-sister chromatids of homologous chromosomes occur?',
          option1: 'Pachytene of Prophase I',
          option2: 'Diplotene of Prophase I',
          option3: 'Zygotene of Prophase I',
          option4: 'Metaphase I',
          correctAnswer: 1,
          explanation: 'Crossing over mediated by the enzyme recombinase occurs during the pachytene stage of Prophase I of meiosis.',
          difficulty: Difficulty.EASY,
          topic: 'Meiosis',
        },
      ],
    },
    // ZOOLOGY
    {
      subject: SubjectType.ZOOLOGY,
      chapterName: 'Human Physiology',
      items: [
        {
          statement: 'The volume of air inspired or expired during normal quiet respiration in a healthy adult human is known as:',
          option1: 'Tidal Volume (~500 mL)',
          option2: 'Inspiratory Reserve Volume (~2500 mL)',
          option3: 'Expiratory Reserve Volume (~1100 mL)',
          option4: 'Residual Volume (~1200 mL)',
          correctAnswer: 1,
          explanation: 'Tidal volume (TV) is the volume of air inspired or expired during normal respiration, approximately 500 mL in a healthy human (~6000 to 8000 mL per minute).',
          difficulty: Difficulty.EASY,
          topic: 'Respiratory Volumes',
        },
        {
          statement: 'Which of the following cells in the gastric glands of the human stomach secretes hydrochloric acid ($HCl$) and intrinsic factor for Vitamin $B_{12}$ absorption?',
          option1: 'Parietal (Oxyntic) cells',
          option2: 'Chief (Peptic) cells',
          option3: 'Goblet (Mucus) cells',
          option4: 'Enteroendocrine cells',
          correctAnswer: 1,
          explanation: 'Oxyntic or parietal cells secrete hydrochloric acid ($HCl$) and Castle\'s intrinsic factor, essential for the absorption of vitamin $B_{12}$ in the ileum.',
          difficulty: Difficulty.EASY,
          topic: 'Digestion and Absorption',
        },
      ],
    },
  ];
}

