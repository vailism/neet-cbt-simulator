export const SINGLE_STUDENT = {
  rollNumber: '240410012345',
  name: 'KUMAR ADITYA',
  email: 'aditya.neet@nta.ac.in',
  avatarUrl: '/candidate-avatar.png',
};

export function getAppPasscode(): string {
  return process.env.APP_PASSCODE || process.env.STUDENT_PASSCODE || 'neet2027';
}

export async function computeAuthToken(passcode: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`neet-auth:${passcode.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function isValidAuthToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expectedToken = await computeAuthToken(getAppPasscode());
  return token === expectedToken;
}

export function verifyPasscode(inputPasscode: string): boolean {
  return inputPasscode.trim() === getAppPasscode();
}
