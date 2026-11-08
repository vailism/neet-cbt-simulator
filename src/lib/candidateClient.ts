'use client';

export interface CandidateInfo {
  rollNumber: string;
  name: string;
  email?: string;
  id?: string;
}

export const DEFAULT_CANDIDATE: CandidateInfo = {
  rollNumber: '240410012345',
  name: 'KUMAR ADITYA',
  email: 'candidate.neet@nta.ac.in',
};

export function getClientCandidate(): CandidateInfo {
  if (typeof window === 'undefined') {
    return DEFAULT_CANDIDATE;
  }

  const roll = localStorage.getItem('neet_candidate_roll') || DEFAULT_CANDIDATE.rollNumber;
  const name = localStorage.getItem('neet_candidate_name') || DEFAULT_CANDIDATE.name;
  const id = localStorage.getItem('neet_candidate_id') || undefined;
  const email = `${roll.toLowerCase()}@neet.nta.ac.in`;

  return { rollNumber: roll, name, id, email };
}

export function saveClientCandidate(candidate: CandidateInfo): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('neet_candidate_roll', candidate.rollNumber.trim().toUpperCase());
  localStorage.setItem('neet_candidate_name', candidate.name.trim().toUpperCase());
  if (candidate.id) {
    localStorage.setItem('neet_candidate_id', candidate.id);
  }

  // Set cookies for server routes
  document.cookie = `neet_candidate_roll=${encodeURIComponent(
    candidate.rollNumber.trim().toUpperCase()
  )}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `neet_candidate_name=${encodeURIComponent(
    candidate.name.trim().toUpperCase()
  )}; path=/; max-age=31536000; SameSite=Lax`;

  // Dispatch custom event for real-time reactivity across components
  window.dispatchEvent(
    new CustomEvent('neet_candidate_updated', {
      detail: candidate,
    })
  );
}

export async function syncCandidateToServer(
  name: string,
  rollNumber: string
): Promise<CandidateInfo> {
  const cleanName = name.trim().toUpperCase() || DEFAULT_CANDIDATE.name;
  const cleanRoll = rollNumber.trim().toUpperCase() || DEFAULT_CANDIDATE.rollNumber;

  const res = await fetch('/api/candidate/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: cleanName, rollNumber: cleanRoll }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update candidate profile.');
  }

  const updated: CandidateInfo = {
    name: data.candidate.name,
    rollNumber: data.candidate.rollNumber,
    id: data.candidate.id,
    email: data.candidate.email,
  };

  saveClientCandidate(updated);
  return updated;
}

