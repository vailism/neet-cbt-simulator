import { PrismaClient } from '@prisma/client';
import { generateMockPaper } from '../src/lib/mockPaperEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('🚀 GENERATING 100 FULL-LENGTH NEET UG 2027 CBT MOCK EXAMINATIONS');
  console.log('===============================================================\n');

  const startTime = Date.now();

  // First, standardize existing titles for papers 11..50 and 99
  const existingPapers = await prisma.mockPaper.findMany({
    select: { id: true, paperNumber: true, title: true, code: true },
  });

  for (const p of existingPapers) {
    const formattedNum = p.paperNumber.toString().padStart(2, '0');
    const standardTitle = `NEET MOCK TEST ${formattedNum}`;
    const standardCode = `MOCK_${formattedNum}`;

    if (p.title !== standardTitle || p.code !== standardCode) {
      await prisma.mockPaper.update({
        where: { id: p.id },
        data: {
          title: standardTitle,
          code: standardCode,
        },
      });
      console.log(`[STANDARDIZED] Paper ${p.paperNumber} title updated to: "${standardTitle}"`);
    }
  }

  // Generate all 100 papers
  let newlyGenerated = 0;
  let verifiedExisting = 0;

  for (let num = 1; num <= 100; num++) {
    const formattedNum = num.toString().padStart(2, '0');
    const existing = await prisma.mockPaper.findUnique({
      where: { paperNumber: num },
      include: {
        _count: { select: { paperQuestions: true } },
      },
    });

    if (existing && existing._count.paperQuestions === 180) {
      verifiedExisting++;
      if (num % 10 === 0 || num === 1) {
        console.log(`✓ Paper ${num.toString().padStart(3, ' ')} / 100 already verified (180 questions, 720 marks)`);
      }
      continue;
    }

    const paper = await generateMockPaper({
      paperNumber: num,
      title: `NEET MOCK TEST ${formattedNum}`,
      description: `Official NEET UG 2027 CBT Full-Length Simulation (180 Questions, 720 Marks)`,
      seed: `NEET_2027_MOCK_SEED_${num.toString().padStart(3, '0')}`,
      easyCount: 54,
      moderateCount: 90,
      difficultCount: 36,
      syllabusVersion: 'NMC_NEET_2027',
    });

    newlyGenerated++;
    if (num % 5 === 0 || num === 100 || newlyGenerated <= 5) {
      console.log(`⚡ [GENERATED] Paper ${num.toString().padStart(3, ' ')} / 100: "${paper.title}" with 180 questions`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n===============================================================`);
  console.log(`✨ COMPLETE: 100 FULL-LENGTH MOCK EXAMINATIONS READY`);
  console.log(`- Total Mock Papers in Database: 100`);
  console.log(`- Newly Generated: ${newlyGenerated}`);
  console.log(`- Verified Pre-existing: ${verifiedExisting}`);
  console.log(`- Total Question Mappings: 18,000 (100 papers x 180 questions)`);
  console.log(`- Total Examination Capacity: 72,000 Marks (100 papers x 720 marks)`);
  console.log(`- Elapsed Time: ${elapsed}s`);
  console.log(`===============================================================`);

  // Final validation check
  const totalCount = await prisma.mockPaper.count();
  const totalPQ = await prisma.mockPaperQuestion.count();
  console.log(`\nDatabase Verification:`);
  console.log(`- MockPaper rows: ${totalCount}`);
  console.log(`- MockPaperQuestion rows: ${totalPQ}`);

  if (totalCount !== 100 || totalPQ !== 18000) {
    throw new Error(`Integrity check mismatch! Expected 100 papers & 18,000 questions, got ${totalCount} papers & ${totalPQ} questions.`);
  }

  console.log(`✅ ALL 100 MOCK PAPERS PASSED COMPLETE INTEGRITY AUDIT!`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('Generation failed:', err);
    prisma.$disconnect();
    process.exit(1);
  });

