import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SINGLE_STUDENT } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty in automated single-student calls
    }

    const cleanRollNumber = (body.rollNumber || SINGLE_STUDENT.rollNumber).trim().toUpperCase();
    const cleanName = (body.name || SINGLE_STUDENT.name).trim().toUpperCase();

    const candidate = await prisma.candidate.upsert({
      where: { rollNumber: cleanRollNumber },
      update: {
        name: cleanName,
        email: body.email ? body.email.trim() : SINGLE_STUDENT.email,
      },
      create: {
        rollNumber: cleanRollNumber,
        name: cleanName,
        email: body.email ? body.email.trim() : SINGLE_STUDENT.email,
        avatarUrl: SINGLE_STUDENT.avatarUrl,
      },
    });

    const response = NextResponse.json({ success: true, candidate });

    response.cookies.set('neet_candidate_roll', candidate.rollNumber, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
    });

    response.cookies.set('neet_candidate_name', candidate.name, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
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
