export interface NeetPrediction {
  score: number;
  maxScore: number;
  percentage: number;
  estimatedAirRange: string;
  estimatedPercentile: number;
  collegeTier: string;
  tierColor: string;
  admissionOutlook: string;
  badge: string;
  guidance: string;
}

export function calculateNeetPrediction(score: number, maxScore = 720): NeetPrediction {
  const normalizedScore = Math.max(0, Math.min(score, maxScore));
  const percentage = Math.round((normalizedScore / maxScore) * 1000) / 10;

  if (normalizedScore >= 710) {
    return {
      score: normalizedScore,
      maxScore,
      percentage,
      estimatedAirRange: 'AIR 1 – 60',
      estimatedPercentile: 99.99,
      collegeTier: 'Top Central Institute (Tier 0)',
      tierColor: 'bg-amber-100 text-amber-900 border-amber-300',
      badge: 'AIIMS New Delhi Tier 🏆',
      admissionOutlook: 'Direct Admission: AIIMS New Delhi, JIPMER Puducherry, MAMC New Delhi.',
      guidance: 'Phenomenal rank potential. Maintain momentum, focus on exam temperament and precision under pressure.',
    };
  }

  if (normalizedScore >= 680) {
    return {
      score: normalizedScore,
      maxScore,
      percentage,
      estimatedAirRange: 'AIR 61 – 1,200',
      estimatedPercentile: 99.85,
      collegeTier: 'Top Central & AIIMS Institutions (Tier 1)',
      tierColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      badge: 'Premier AIIMS / MAMC Tier 🌟',
      admissionOutlook: 'Guaranteed 15% AIQ: AIIMS (Bhopal, Rishikesh, Bhubaneswar), VMMC, LHMC, UCMS Delhi.',
      guidance: 'Elite tier performance. Polish any remaining negative marks in Physics to breach the 700+ milestone.',
    };
  }

  if (normalizedScore >= 650) {
    return {
      score: normalizedScore,
      maxScore,
      percentage,
      estimatedAirRange: 'AIR 1,201 – 5,500',
      estimatedPercentile: 99.4,
      collegeTier: 'Top State Govt Medical Colleges (Tier 1)',
      tierColor: 'bg-blue-100 text-blue-900 border-blue-300',
      badge: 'Top State Govt MBBS 🎖️',
      admissionOutlook: 'Top State Govt MBBS: KGMU Lucknow, Seth GS Mumbai, BMC Bangalore, SMS Jaipur, Calcutta Medical.',
      guidance: 'Excellent competitive position. Keep Biology at 340+ and trim down -1 marks in physical chemistry.',
    };
  }

  if (normalizedScore >= 615) {
    return {
      score: normalizedScore,
      maxScore,
      percentage,
      estimatedAirRange: 'AIR 5,501 – 18,000',
      estimatedPercentile: 98.2,
      collegeTier: 'All India Quota (AIQ) Govt Medical Colleges',
      tierColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      badge: 'Govt Medical College (AIQ 15%)',
      admissionOutlook: 'Comfortable Govt MBBS seat via 15% All India Quota and State Quota.',
      guidance: 'Solid baseline. Identify time-traps where you spend >2.5 minutes to gain 10-15 additional net questions.',
    };
  }

  if (normalizedScore >= 580) {
    return {
      score: normalizedScore,
      maxScore,
      percentage,
      estimatedAirRange: 'AIR 18,001 – 45,000',
      estimatedPercentile: 95.8,
      collegeTier: 'State Quota Govt / Semi-Govt MBBS',
      tierColor: 'bg-teal-100 text-teal-900 border-teal-300',
      badge: 'State Govt MBBS Borderline',
      admissionOutlook: 'Competitive for State Quota Govt Medical Colleges (depending on domicile) and top Semi-Govt institutes.',
      guidance: 'Critical cutoff boundary. Improving NCERT Biology recall to 320+ will securely push your score past 630+.',
    };
  }

  if (normalizedScore >= 500) {
    return {
      score: normalizedScore,
      maxScore,
      percentage,
      estimatedAirRange: 'AIR 45,001 – 1,15,000',
      estimatedPercentile: 89.5,
      collegeTier: 'Govt BDS / Private Merit MBBS',
      tierColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      badge: 'Merit BDS / Semi-Govt',
      admissionOutlook: 'Eligible for Government BDS seats, top deemed universities, and private medical college merit quotas.',
      guidance: 'High error rate in Physics or Chemistry. Run the Mistake Drill to eliminate repetitive concept gaps.',
    };
  }

  return {
    score: normalizedScore,
    maxScore,
    percentage,
    estimatedAirRange: 'AIR > 1,15,000',
    estimatedPercentile: Math.max(30, Math.round(percentage * 0.9)),
    collegeTier: 'Foundation / Remedial Practice Tier',
    tierColor: 'bg-rose-100 text-rose-900 border-rose-300',
    badge: 'Revision Required 📚',
    admissionOutlook: 'Meets general qualifying threshold, but requires systematic revision for Govt Medical College seat.',
    guidance: 'Focus on NCERT line-by-line in Biology and fundamental formula drills in Physics before attempting full 180Q mocks.',
  };
}

