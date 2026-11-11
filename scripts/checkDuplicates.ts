import { prisma } from '../src/lib/prisma';

async function check() {
  const totalQuestions = await prisma.question.count();
  console.log('Total questions in DB:', totalQuestions);

  // Check for duplicate hashes
  const duplicateHashes: any[] = await prisma.$queryRaw`
    SELECT "duplicateHash", COUNT(*) as count 
    FROM "Question" 
    WHERE "duplicateHash" IS NOT NULL 
    GROUP BY "duplicateHash" 
    HAVING COUNT(*) > 1;
  `;
  console.log('Duplicate hashes found:', duplicateHashes.length);
  if (duplicateHashes.length > 0) {
    console.log('Sample duplicate hashes:', duplicateHashes.slice(0, 5));
  }

  // Check for exact duplicate statement text
  const duplicateStatements: any[] = await prisma.$queryRaw`
    SELECT statement, COUNT(*) as count 
    FROM "Question" 
    GROUP BY statement 
    HAVING COUNT(*) > 1;
  `;
  console.log('Duplicate statement texts found in Question table:', duplicateStatements.length);
  if (duplicateStatements.length > 0) {
    console.log('Sample duplicate statements:', duplicateStatements.slice(0, 3));
  }

  // Check within each mock paper
  const papers = await prisma.mockPaper.findMany({
    select: {
      id: true,
      paperNumber: true,
      code: true,
      paperQuestions: {
        select: { questionId: true }
      }
    }
  });

  let internalDupes = 0;
  for (const p of papers) {
    const ids = p.paperQuestions.map(q => q.questionId);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      console.log(`Paper ${p.code} has ${ids.length - uniqueIds.size} duplicate questions within itself!`);
      internalDupes++;
    }
  }
  console.log('Papers with internal duplicates:', internalDupes);

  // Check candidate attempts
  const attempts = await prisma.examAttempt.findMany({
    select: {
      id: true,
      title: true,
      questions: {
        select: { questionId: true }
      }
    }
  });
  console.log('Total attempts in DB:', attempts.length);
  for (const a of attempts) {
    const ids = a.questions.map(q => q.questionId);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      console.log(`Attempt ${a.id} (${a.title}) has ${ids.length - uniqueIds.size} duplicate questions within itself!`);
    }
  }
}

check()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
