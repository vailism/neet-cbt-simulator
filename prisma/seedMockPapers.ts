import { PrismaClient } from '@prisma/client';
import { generateMockPaper } from '../src/lib/mockPaperEngine';
import { computeDuplicateHash } from '../src/lib/questionValidation';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Mock Papers & Updating Question Hashes ---');

  // 1. Backfill duplicateHash for all existing questions
  const allQuestions = await prisma.question.findMany({
    select: { id: true, statement: true, duplicateHash: true },
  });

  console.log(`Checking duplicate hashes for ${allQuestions.length} questions...`);
  let hashUpdated = 0;
  for (const q of allQuestions) {
    if (!q.duplicateHash) {
      const hash = computeDuplicateHash(q.statement);
      await prisma.question.update({
        where: { id: q.id },
        data: { duplicateHash: hash },
      });
      hashUpdated++;
    }
  }
  console.log(`✅ Updated hashes for ${hashUpdated} questions.`);

  // 2. Generate Initial Mock Papers (Mock Test 001 through Mock Test 010)
  console.log('Generating Initial Mock Papers (Mock 001 to 010)...');
  for (let num = 1; num <= 10; num++) {
    const paper = await generateMockPaper({
      paperNumber: num,
      title: `NEET (UG) Official Mock Test ${num.toString().padStart(3, '0')}`,
      description: `Complete 180-Question CBT Mock Exam per NTA & NMC Syllabus Pattern (Physics: 45, Chemistry: 45, Botany: 45, Zoology: 45)`,
    });
    console.log(`✅ Generated Mock Test ${num.toString().padStart(3, '0')} (ID: ${paper.id})`);
  }

  console.log('--- Mock Paper Seeding Complete! ---');
}

main()
  .catch((e) => {
    console.error('Error in mock paper seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
