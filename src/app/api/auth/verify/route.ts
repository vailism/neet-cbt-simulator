import { NextRequest, NextResponse } from 'next/server';
import { verifyPasscode, computeAuthToken, getAppPasscode, SINGLE_STUDENT } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();

    if (!passcode || !verifyPasscode(passcode)) {
      return NextResponse.json(
        { error: 'Incorrect passcode. Access is restricted to authorized student.' },
        { status: 401 }
      );
    }

    const token = await computeAuthToken(getAppPasscode());
    const response = NextResponse.json({
      success: true,
      student: SINGLE_STUDENT,
    });

    // 1-year private authentication cookie
    response.cookies.set('neet_auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    response.cookies.set('neet_candidate_roll', SINGLE_STUDENT.rollNumber, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    response.cookies.set('neet_candidate_name', SINGLE_STUDENT.name, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
