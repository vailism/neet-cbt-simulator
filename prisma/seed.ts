import { PrismaClient, SubjectType, Difficulty, VerificationStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { generateHundredMockPapers } from '../src/lib/mockPaperEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('🌱 SEEDING NEET UG 2027 CBT SIMULATOR DATABASE');
  console.log('===============================================================\n');

  const startTime = Date.now();

  // 1. Default Examination Configuration
  const defaultExamConfig = await prisma.examConfiguration.upsert({
    where: { code: 'NEET_UG_DEFAULT' },
    update: {},
    create: {
      name: 'NEET (UG) 2027 Standard CBT Pattern',
      code: 'NEET_UG_DEFAULT',
      durationMinutes: 180,
      totalQuestions: 180,
      physicsQuestions: 45,
      chemistryQuestions: 45,
      botanyQuestions: 45,
      zoologyQuestions: 45,
      marksPerCorrect: 4,
      marksPerIncorrect: -1,
      marksPerUnanswered: 0,
      easyPercent: 30,
      moderatePercent: 50,
      difficultPercent: 20,
      isDefault: true,
    },
  });
  console.log(`✓ Configuration ready: ${defaultExamConfig.name}`);

  // 2. Default Test Candidate
  const defaultCandidate = await prisma.candidate.upsert({
    where: { rollNumber: '240410012345' },
    update: {},
    create: {
      rollNumber: '240410012345',
      name: 'KUMAR ADITYA',
      email: 'aditya.kumar@neet2027.in',
      avatarUrl: '/candidate-avatar.png',
    },
  });
  console.log(`✓ Default candidate ready: ${defaultCandidate.name} (${defaultCandidate.rollNumber})`);

  // 3. Subjects & Chapters (preserve IDs and map relations reliably)
  const seedFilePath = path.join(__dirname, 'fullQuestionBankSeed.json');
  const subjectMap = new Map<SubjectType, string>();
  const oldSubjectIdToCode = new Map<string, SubjectType>();

  if (fs.existsSync(seedFilePath)) {
    const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
    for (const s of seedData.subjects) {
      const sub = await prisma.subject.upsert({
        where: { code: s.code },
        update: { name: s.name, order: s.order },
        create: { id: s.id, code: s.code, name: s.name, order: s.order },
      });
      subjectMap.set(s.code, sub.id);
      oldSubjectIdToCode.set(s.id, s.code);
    }
    console.log(`✓ 4 Core Subjects ready: Physics, Chemistry, Botany, Zoology`);

    console.log(`\n📚 Loading ${seedData.questions.length} questions from question bank archive...`);

    // Ensure all chapters exist
    const chapterMap = new Map<string, string>();
    const chaptersToInsert = [];
    for (const c of seedData.chapters) {
      const subCode = oldSubjectIdToCode.get(c.subjectId);
      const targetSubjectId = subCode ? subjectMap.get(subCode)! : c.subjectId;
      chapterMap.set(c.id, c.id);
      chaptersToInsert.push({
        id: c.id,
        subjectId: targetSubjectId,
        name: c.name,
      });
    }

    await prisma.chapter.createMany({
      data: chaptersToInsert,
      skipDuplicates: true,
    });
    console.log(`✓ ${seedData.chapters.length} NCERT Syllabus Chapters verified`);

    // Seed questions in fast batch chunks using createMany
    const existingQCount = await prisma.question.count();
    if (existingQCount < seedData.questions.length) {
      console.log(`Seeding questions with bulk inserts (current: ${existingQCount}, target: ${seedData.questions.length})...`);
      const chunkSize = 500;
      for (let i = 0; i < seedData.questions.length; i += chunkSize) {
        const chunk = seedData.questions.slice(i, i + chunkSize);
        const mappedData = chunk.map((q: any) => {
          const subCode = oldSubjectIdToCode.get(q.subjectId);
          const targetSubjectId = subCode ? subjectMap.get(subCode)! : q.subjectId;
          const targetChapterId = chapterMap.get(q.chapterId) || q.chapterId;

          return {
            id: q.id,
            subjectId: targetSubjectId,
            chapterId: targetChapterId,
            topic: q.topic,
            statement: q.statement,
            imageUrl: q.imageUrl,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty as Difficulty,
            verificationStatus: q.verificationStatus as VerificationStatus,
            duplicateHash: q.duplicateHash,
            previousYear: q.previousYear,
            isVerifiedPYQ: q.isVerifiedPYQ,
            source: q.source,
            verifiedAt: q.verifiedAt ? new Date(q.verifiedAt) : undefined,
            verifiedBy: q.verifiedBy,
          };
        });

        await prisma.question.createMany({
          data: mappedData,
          skipDuplicates: true,
        });
        console.log(`  - Inserted chunk ${Math.min(i + chunkSize, seedData.questions.length)} / ${seedData.questions.length}`);
      }
      console.log(`✓ All ${seedData.questions.length} questions seeded in PostgreSQL!`);
    } else {
      console.log(`✓ Question bank already contains ${existingQCount} questions.`);
    }
  }

  // 5. Generate / Verify All 100 Mock Papers
  console.log(`\n📄 Verifying 100 Full-Length Mock Examinations (18,000 questions)...`);
  const existingPaperCount = await prisma.mockPaper.count();
  if (existingPaperCount < 100) {
    console.log(`Generating remaining mock papers to reach 100 papers...`);
    await generateHundredMockPapers(1, 100, (current) => {
      if (current % 20 === 0 || current === 100) {
        console.log(`- Progress: ${current} / 100 papers generated`);
      }
    });
  } else {
    console.log(`✓ All 100 Mock Papers already exist and verified in database.`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n===============================================================`);
  console.log(`✨ DATABASE SEED COMPLETED IN ${elapsed}s`);
  console.log(`- Questions in Bank: ${await prisma.question.count()}`);
  console.log(`- Mock Papers: ${await prisma.mockPaper.count()}`);
  console.log(`- Mock Paper Questions: ${await prisma.mockPaperQuestion.count()}`);
  console.log(`===============================================================`);
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
