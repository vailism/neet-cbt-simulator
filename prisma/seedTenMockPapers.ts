import { PrismaClient } from '@prisma/client';
import { generateTenMockPapers } from '../src/lib/mockPaperEngine';

const prisma = new PrismaClient();

async function run() {
  console.log('=== GENERATING 10 COMPLETE NEET 2027 FULL-LENGTH MOCK EXAMINATIONS ===');

  // Clean up any older mock papers
  console.log('Cleaning up existing mock papers to regenerate pristine 10 mock papers...');
  await prisma.mockPaperQuestion.deleteMany({});
  await prisma.mockPaper.deleteMany({});

  const papers = await generateTenMockPapers();

  console.log(`\n🎉 Successfully generated ${papers.length} complete mock examinations!`);
  for (const p of papers) {
    const qCount = await prisma.mockPaperQuestion.count({
      where: { mockPaperId: p.id },
    });
    console.log(`- ${p.title} (${p.code}): ${qCount} questions, seed: ${p.randomSeed}`);
  }

  // Cross-paper repetition check
  const allPaperQuestions = await prisma.mockPaperQuestion.findMany({
    select: { questionId: true, mockPaperId: true },
  });

  const questionUsageMap = new Map<string, number>();
  for (const pq of allPaperQuestions) {
    questionUsageMap.set(pq.questionId, (questionUsageMap.get(pq.questionId) || 0) + 1);
  }

  let repeatedCount = 0;
  for (const [, count] of questionUsageMap.entries()) {
    if (count > 1) repeatedCount++;
  }

  console.log(`\nQuestion uniqueness across all 10 papers:`);
  console.log(`- Total question slots: ${allPaperQuestions.length} (10 papers x 180 questions)`);
  console.log(`- Unique questions used: ${questionUsageMap.size}`);
  console.log(`- Repeated questions across papers: ${repeatedCount} (${((1 - repeatedCount / allPaperQuestions.length) * 100).toFixed(1)}% unique)`);
}

run()
  .catch((e) => {
    console.error('Error generating 10 mock papers:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

