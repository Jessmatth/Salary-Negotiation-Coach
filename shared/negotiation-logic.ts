import type { LeverageQuizInput, LeverageResult } from "./schema";

// Leverage scoring weights for each question
const LEVERAGE_WEIGHTS: Record<string, Record<string, number>> = {
  otherOffers: {
    none: 0,
    one: 15,
    two: 22,
    three_plus: 30,
  },
  companyUrgency: {
    no_rush: 0,
    normal: 6,
    urgent: 15,
  },
  skillUniqueness: {
    many_qualified: 0,
    some_unique: 8,
    rare_critical: 15,
  },
  employmentStatus: {
    unemployed: 0,
    employed_looking: 5,
    employed_happy: 10,
    retention_offer: 12,
  },
  pipelineProgress: {
    not_interviewing: 0,
    early_stages: 4,
    final_rounds: 8,
    deadlines_approaching: 12,
  },
  managerInvestment: {
    standard_process: 0,
    moderately_interested: 4,
    very_invested: 8,
  },
  companyFinancials: {
    struggling: -5,
    stable: 3,
    growing_funded: 8,
  },
  willingnessToWalk: {
    need_this_job: -10,
    prefer_but_options: 5,
    genuinely_indifferent: 10,
  },
};

// Tactical recommendations by tier
const TACTICS_BY_TIER: Record<string, string[]> = {
  low: [
    "Lead with enthusiasm and genuine excitement about the role",
    "Frame your ask as 'bringing the offer closer to market' rather than demanding more",
    "Emphasize non-salary improvements: title, scope, flexibility, or start date",
    "Keep your counter modest and well-researched",
    "Focus on building rapport and demonstrating long-term value",
  ],
  moderate: [
    "Open with appreciation, then transition firmly to your market research",
    "Present your counter with confidence backed by specific data points",
    "Mention (without ultimatums) that you're evaluating other opportunities",
    "Negotiate multiple components: base, bonus, equity, sign-on",
    "Set a reasonable decision timeline that creates urgency",
  ],
  high: [
    "Lead with your competing offers and timeline constraints",
    "Anchor high—ask for 15-25% above their initial offer",
    "Negotiate aggressively on equity and sign-on bonus",
    "Request accelerated review timelines",
    "Be willing to walk away and let them know it",
  ],
};

// Risk assessment messages
const RISK_MESSAGES: Record<string, string> = {
  low: "Proceed carefully. There is increased risk of pushback if you push too hard. Keep your ask modest, collaborative, and framed around mutual fit. Employers rarely rescind offers for reasonable negotiation, but your position limits how boldly you can counter.",
  moderate: "Low to moderate risk. A reasonable, well-framed ask is unlikely to jeopardize the offer. You have enough leverage to negotiate confidently without appearing demanding. Focus on professionalism and clear communication.",
  high: "Low risk of offer withdrawal. You're in high demand—the main risk is misalignment on expectations or burning bridges if you come across as arrogant. Be bold but respectful, and remember they want you.",
};

// Tier labels and taglines
const TIER_INFO: Record<string, { label: string; tagline: string }> = {
  low: {
    label: "Low Leverage",
    tagline: "Focus on demonstrating value and building rapport.",
  },
  moderate: {
    label: "Moderate Leverage", 
    tagline: "You have room to negotiate confidently.",
  },
  high: {
    label: "High Leverage",
    tagline: "You're in the driver's seat – be bold.",
  },
};

// Suggested negotiation ranges by tier
const RANGE_BY_TIER: Record<string, { minPercent: number; maxPercent: number }> = {
  low: { minPercent: 5, maxPercent: 10 },
  moderate: { minPercent: 10, maxPercent: 15 },
  high: { minPercent: 15, maxPercent: 25 },
};

export function calculateLeverageScore(input: LeverageQuizInput): LeverageResult {
  let score = 0;
  
  // Calculate raw score from all answers
  for (const [key, value] of Object.entries(input)) {
    const weights = LEVERAGE_WEIGHTS[key];
    if (weights && value in weights) {
      score += weights[value as string];
    }
  }
  
  // Normalize to 0-100 range (max possible is ~100, min is -15)
  score = Math.max(0, Math.min(100, score));
  
  // Determine tier
  let tier: "low" | "moderate" | "high";
  if (score <= 33) {
    tier = "low";
  } else if (score <= 66) {
    tier = "moderate";
  } else {
    tier = "high";
  }
  
  const tierInfo = TIER_INFO[tier];
  const range = RANGE_BY_TIER[tier];
  
  return {
    score,
    tier,
    tierLabel: tierInfo.label,
    tagline: tierInfo.tagline,
    tactics: TACTICS_BY_TIER[tier],
    suggestedRange: {
      minPercent: range.minPercent,
      maxPercent: range.maxPercent,
    },
    riskAssessment: RISK_MESSAGES[tier],
  };
}

export function calculateLeverageWithDollars(
  input: LeverageQuizInput, 
  currentOffer: number
): LeverageResult {
  const result = calculateLeverageScore(input);
  
  result.suggestedRange.minDollars = Math.round(currentOffer * (result.suggestedRange.minPercent / 100));
  result.suggestedRange.maxDollars = Math.round(currentOffer * (result.suggestedRange.maxPercent / 100));
  
  return result;
}

// Script generation logic
interface ScriptContext {
  jobTitle: string;
  companyName?: string;
  yearsExperience: number;
  location: string;
  currentOffer: number;
  marketMedian: number;
  askAmount: number;
  tone: "polite" | "professional" | "aggressive";
}

const TONE_PHRASES = {
  opening: {
    polite: "Thank you so much for the offer to join as",
    professional: "I appreciate the offer for the",
    aggressive: "I've reviewed the offer for the",
  },
  transition: {
    polite: "I was hoping we might be able to discuss",
    professional: "Based on my research, I'd like to discuss",
    aggressive: "Given my experience and market data, I need to address",
  },
  ask: {
    polite: "Would it be possible to explore a base salary closer to",
    professional: "I'm looking for a base salary in the range of",
    aggressive: "I expect a base salary of at least",
  },
  justification: {
    polite: "I believe this would better reflect",
    professional: "This aligns with",
    aggressive: "This is consistent with",
  },
  closing: {
    polite: "I'm very excited about this opportunity and hope we can find a way to make this work.",
    professional: "I'm confident we can come to a mutually beneficial agreement.",
    aggressive: "I look forward to your revised offer.",
  },
};

export function generateNegotiationScript(context: ScriptContext): { subject: string; body: string } {
  const { tone, jobTitle, companyName, yearsExperience, currentOffer, marketMedian, askAmount } = context;
  const phrases = {
    opening: TONE_PHRASES.opening[tone],
    transition: TONE_PHRASES.transition[tone],
    ask: TONE_PHRASES.ask[tone],
    justification: TONE_PHRASES.justification[tone],
    closing: TONE_PHRASES.closing[tone],
  };
  
  const formatMoney = (n: number) => `$${n.toLocaleString()}`;
  const companyRef = companyName ? ` at ${companyName}` : "";
  
  const subject = tone === "aggressive" 
    ? "Regarding my offer - compensation discussion" 
    : "Regarding my offer";
  
  const body = `Dear Hiring Team,

${phrases.opening} ${jobTitle}${companyRef}. I'm genuinely excited about the opportunity and the team.

${phrases.transition} the compensation. After researching the market for similar roles with ${yearsExperience}+ years of experience, I found that the median compensation is around ${formatMoney(marketMedian)}.

${phrases.ask} ${formatMoney(askAmount)}. ${phrases.justification} market rates for this level of experience and the value I'll bring to the team.

${phrases.closing}

Best regards`;
  
  return { subject, body };
}

// Market position calculation
export function calculateMarketPosition(
  offer: number, 
  marketRange: { min: number; p25: number; median: number; p75: number; max: number }
): {
  percentile: number;
  zone: "very_underpaid" | "underpaid" | "fair" | "above_market" | "well_above_market";
  difference: number;
  differencePercent: number;
} {
  const { min, p25, median, p75, max } = marketRange;
  
  // Calculate percentile position
  let percentile: number;
  if (offer <= min) {
    percentile = 5;
  } else if (offer <= p25) {
    percentile = 10 + ((offer - min) / (p25 - min)) * 15;
  } else if (offer <= median) {
    percentile = 25 + ((offer - p25) / (median - p25)) * 25;
  } else if (offer <= p75) {
    percentile = 50 + ((offer - median) / (p75 - median)) * 25;
  } else if (offer <= max) {
    percentile = 75 + ((offer - p75) / (max - p75)) * 20;
  } else {
    percentile = 95;
  }
  
  // Determine zone
  let zone: "very_underpaid" | "underpaid" | "fair" | "above_market" | "well_above_market";
  if (percentile < 20) {
    zone = "very_underpaid";
  } else if (percentile < 40) {
    zone = "underpaid";
  } else if (percentile < 60) {
    zone = "fair";
  } else if (percentile < 80) {
    zone = "above_market";
  } else {
    zone = "well_above_market";
  }
  
  const difference = offer - median;
  const differencePercent = Math.round((difference / median) * 100);
  
  return {
    percentile: Math.round(percentile),
    zone,
    difference,
    differencePercent,
  };
}

// Narrative generation based on position
export function generateNarrative(
  position: ReturnType<typeof calculateMarketPosition>,
  context: { jobTitle: string; yearsExperience: number; location: string }
): string {
  const { zone, difference, differencePercent } = position;
  const absDiff = Math.abs(difference);
  const formatMoney = (n: number) => `$${n.toLocaleString()}`;
  
  switch (zone) {
    case "very_underpaid":
      return `Based on your role as ${context.jobTitle} with ${context.yearsExperience} years of experience in ${context.location}, you're significantly below market. You're leaving approximately ${formatMoney(absDiff)} (${Math.abs(differencePercent)}%) on the table. Strong negotiation is recommended.`;
    case "underpaid":
      return `Based on market data for ${context.jobTitle} roles with your experience level, this offer is ${Math.abs(differencePercent)}% below the median. You could potentially negotiate ${formatMoney(absDiff)} more.`;
    case "fair":
      return `This offer is within the typical range for ${context.jobTitle} roles with ${context.yearsExperience} years of experience. You're within ${formatMoney(absDiff)} of the market median—a fair starting point.`;
    case "above_market":
      return `This is a competitive offer, ${differencePercent}% above market median for ${context.jobTitle} roles. You may still negotiate, but recognize this is already strong.`;
    case "well_above_market":
      return `Excellent offer! This is ${differencePercent}% above the market median for similar roles. You're in a strong position—any negotiation should focus on non-salary benefits.`;
  }
}
