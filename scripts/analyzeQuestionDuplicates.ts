import { prisma } from '../src/lib/prisma';

async function analyze() {
  const allQuestions = await prisma.question.findMany({
    select: { id: true, statement: true, duplicateHash: true, subjectId: true, difficulty: true },
  });

  const uniqueStatements = new Set<string>();
  const uniqueHashes = new Set<string>();
  const duplicates: any[] = [];

  for (const q of allQuestions) {
    const norm = q.statement.trim().toLowerCase();
    if (uniqueStatements.has(norm)) {
      duplicates.push(q);
    } else {
      uniqueStatements.add(norm);
    }
    if (q.duplicateHash) uniqueHashes.add(q.duplicateHash);
  }

  console.log('Total Questions in DB:', allQuestions.length);
  console.log('Truly Unique Statements:', uniqueStatements.size);
  console.log('Truly Unique Hashes:', uniqueHashes.size);
  console.log('Duplicate rows in Question table:', duplicates.length);

  // Group by statement
  const stmtCounts: Record<string, number> = {};
  for (const q of allQuestions) {
    const s = q.statement.trim();
    stmtCounts[s] = (stmtCounts[s] || 0) + 1;
  }
  const multiCount = Object.values(stmtCounts).filter(c => c > 1).length;
  console.log('Distinct statements that appear > 1 time:', multiCount);

  // Let us see how many unique questions exist per subject
  const subjects = await prisma.subject.findMany();
  for (const sub of subjects) {
    const subQs = allQuestions.filter(q => q.subjectId === sub.id);
    const subUnique = new Set(subQs.map(q => q.statement.trim().toLowerCase()));
    console.log(`Subject ${sub.name} (${sub.code}): total rows = ${subQs.length}, unique statements = ${subUnique.size}`);
  }
}

analyze().then(() => prisma.$disconnect());

