import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VerificationStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionId, status, rejectionReason, reviewerNotes } = body;

    if (!questionId || !status) {
      return NextResponse.json(
        { error: 'questionId and status (VERIFIED / REJECTED / NEEDS_REVIEW) are required.' },
        { status: 400 }
      );
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        verificationStatus: status as VerificationStatus,
        rejectionReason: status === 'REJECTED' ? rejectionReason || 'Failed verification criteria' : null,
        reviewerNotes: reviewerNotes || null,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedBy: 'Senior Examination Reviewer',
      },
    });

    return NextResponse.json({
      success: true,
      questionId: updated.id,
      status: updated.verificationStatus,
    });
  } catch (error: any) {
    console.error('Verify question error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

