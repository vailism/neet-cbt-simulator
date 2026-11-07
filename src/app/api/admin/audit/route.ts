import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { performQuestionBankAudit } from '@/lib/auditQuestionBank';

export async function GET(req: NextRequest) {
  try {
    const reportPath = path.join(process.cwd(), 'src', 'data', 'question_bank_audit_report.json');

    if (fs.existsSync(reportPath)) {
      const data = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      return NextResponse.json({
        success: true,
        report: data.report,
        sampleRecords: data.auditedRecords.slice(0, 100),
      });
    }

    // If file does not exist, compute on the fly
    const { report, auditedRecords } = await performQuestionBankAudit();
    return NextResponse.json({
      success: true,
      report,
      sampleRecords: auditedRecords.slice(0, 100),
    });
  } catch (error: any) {
    console.error('Audit report fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve audit report.' },
      { status: 500 }
    );
  }
}
