import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { rollNumber, name, email } = await req.json();

    if (!rollNumber || !name) {
      return NextResponse.json(
        { error: 'Roll number and Candidate Name are required.' },
        { status: 400 }
      );
    }

    const cleanRollNumber = rollNumber.trim().toUpperCase();
    const cleanName = name.trim().toUpperCase();

    const candidate = await prisma.candidate.upsert({
      where: { rollNumber: cleanRollNumber },
      update: {
        name: cleanName,
        email: email ? email.trim() : null,
      },
      create: {
        rollNumber: cleanRollNumber,
        name: cleanName,
        email: email ? email.trim() : null,
        avatarUrl: '/candidate-avatar.png',
      },
    });

    const response = NextResponse.json({ success: true, candidate });

    // Store candidate rollNumber in cookie for persistence
    response.cookies.set('neet_candidate_roll', candidate.rollNumber, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Candidate login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
