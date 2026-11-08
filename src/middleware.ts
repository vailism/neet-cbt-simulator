import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public static assets and auth unlock paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico' ||
    pathname === '/candidate-avatar.png' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname === '/unlock' ||
    pathname === '/api/auth/verify'
  ) {
    return NextResponse.next();
  }

  // 2. Compute expected authentication token from environment passcode
  const passcode = process.env.APP_PASSCODE || process.env.STUDENT_PASSCODE || 'neet2027';
  const enc = new TextEncoder();
  const data = enc.encode(`neet-auth:${passcode.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedToken = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const cookieToken = req.cookies.get('neet_auth_token')?.value;

  if (cookieToken === expectedToken) {
    return NextResponse.next();
  }

  // 3. Unauthorized: block API calls with 401, redirect browser pages to /unlock
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Unauthorized: Private single-student examination platform' },
      { status: 401 }
    );
  }

  const unlockUrl = req.nextUrl.clone();
  unlockUrl.pathname = '/unlock';
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
