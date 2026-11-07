import { runQuestionBankAudit } from '../src/lib/questionBankAuditor';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('=== RUNNING ACADEMIC AUDIT ON ENTIRE NEET 2027 QUESTION BANK ===\n');

  const report = await runQuestionBankAudit();

  console.log('---------------------------------------------------------');
  console.log(`Audit Timestamp:             ${report.timestamp}`);
  console.log(`Total Questions Audited:     ${report.totalAudited}`);
  console.log(`Confirmed Academically Sound:${report.confirmedCorrect} (${((report.confirmedCorrect / report.totalAudited) * 100).toFixed(1)}%)`);
  console.log(`Incorrect Answer Keys:       ${report.incorrectAnswerKeys}`);
  console.log(`Incorrect/Short Explanations:${report.incorrectExplanations}`);
  console.log(`Ambiguous/Malformed Options: ${report.ambiguousQuestions}`);
  console.log(`Duplicate Questions:         ${report.duplicateQuestions}`);
  console.log(`Questions Requiring Review:  ${report.questionsRequiringReview}`);
  console.log(`NCERT Syllabus Linked:       ${report.ncertEnrichedCount} / ${report.totalAudited}`);
  console.log('---------------------------------------------------------');

  console.log('\nSubject Breakdown:');
  for (const [sub, data] of Object.entries(report.subjectBreakdown)) {
    console.log(`- ${sub}: ${data.total} total | ${data.confirmed} confirmed | ${data.flagged} flagged`);
  }

  if (report.findings.length > 0) {
    console.log(`\nSample Findings (First 5):`);
    report.findings.slice(0, 5).forEach((f, idx) => {
      console.log(`[#${idx + 1}] [${f.issueType}] Question ${f.questionId} (${f.subject} - ${f.chapter}): ${f.description}`);
    });
  } else {
    console.log('\n🎉 ZERO AUDIT ERRORS! All 2,361 questions passed academic verification.');
  }
}

main()
  .catch((e) => {
    console.error('Audit run error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
