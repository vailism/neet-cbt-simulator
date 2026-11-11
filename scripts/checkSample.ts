import { prisma } from '../src/lib/prisma';

async function checkSample() {
  const duplicates = await prisma.$queryRaw<any[]>`
    SELECT statement, array_agg(id) as ids, count(*) as count
    FROM "Question"
    GROUP BY statement
    HAVING count(*) > 1
    ORDER BY count(*) DESC
    LIMIT 5;
  `;
  console.log(JSON.stringify(duplicates, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

checkSample().then(() => prisma.$disconnect());
