import { prisma } from '../src/lib/prisma';

async function checkPaperDuplicates() {
  const papers = await prisma.mockPaper.findMany({
    select: {
      id: true,
      code: true,
      paperNumber: true,
      paperQuestions: {
        select: {
          questionId: true,
          question: {
            select: {
              id: true,
              statement: true,
              duplicateHash: true,
            }
          }
        }
      }
    }
  });

  let papersWithSameStatement = 0;
  for (const p of papers) {
    const statements = new Set<string>();
    const dupes: string[] = [];
    for (const pq of p.paperQuestions) {
      const s = pq.question.statement.trim().toLowerCase();
      if (statements.has(s)) {
        dupes.push(s);
      } else {
        statements.add(s);
      }
    }
    if (dupes.length > 0) {
      papersWithSameStatement++;
      console.log(`Paper ${p.code} has ${dupes.length} duplicate questions with identical statements!`);
    }
  }
  console.log(`Total papers with duplicated question statements within the same paper: ${papersWithSameStatement} / ${papers.length}`);
}

checkPaperDuplicates().then(() => prisma.$disconnect());
