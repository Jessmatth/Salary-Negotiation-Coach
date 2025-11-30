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

// Script generation logic - Enhanced with 7-section structure and phrase banks

interface ScriptContext {
  jobTitle: string;
  companyName?: string;
  yearsExperience: number;
  location: string;
  currentOffer: number;
  bonusSummary?: string;
  marketRangeLow: number;
  marketRangeHigh: number;
  marketMedian: number;
  leverageTier: "low" | "moderate" | "high";
  suggestedRangeMinPercent: number;
  suggestedRangeMaxPercent: number;
  scenarioType: "external" | "internal_raise" | "retention";
  tone: "polite" | "professional" | "aggressive";
  askAmount?: number;
}

const formatMoney = (n: number) => `$${n.toLocaleString()}`;

// Section 1: Gratitude & Enthusiasm
const GRATITUDE_PHRASES = {
  external: {
    polite: (company: string, role: string) => 
      `Thank you again for the offer to join ${company} as a ${role}. I really appreciate the time the team has invested, and I'm excited about the opportunity.`,
    professional: (company: string, role: string) =>
      `Thank you for the offer to join ${company} as a ${role}. I've enjoyed the conversations with the team and I'm enthusiastic about the role.`,
    aggressive: (company: string, role: string) =>
      `Thank you for the offer to join ${company} as a ${role}. I'm excited about the impact this role can have and the chance to contribute at ${company}.`,
  },
  internal_raise: {
    polite: (company: string, role: string) =>
      `Thank you for taking the time to discuss my role and compensation. I'm grateful for the opportunities I've had at ${company} and excited about continuing to grow here.`,
    professional: (company: string, role: string) =>
      `I appreciate the opportunity to discuss my compensation. I've valued my time at ${company} and I'm committed to continuing to deliver strong results.`,
    aggressive: (company: string, role: string) =>
      `Thank you for the opportunity to discuss my compensation. I'm proud of what I've accomplished at ${company} and believe it's time to align my compensation with my contributions.`,
  },
  retention: {
    polite: (company: string, role: string) =>
      `Thank you for taking the time to discuss this with me. I've appreciated my time at ${company} and want to find a path forward that works for both of us.`,
    professional: (company: string, role: string) =>
      `I appreciate you taking the time to discuss retention options. I value what I've built at ${company} and want to explore how we can continue working together.`,
    aggressive: (company: string, role: string) =>
      `Thank you for the opportunity to discuss this. Given the alternatives I'm considering, I want to be direct about what it would take for me to stay at ${company}.`,
  },
};

// Section 2: Offer Recap
function generateOfferRecap(offer: number, bonusSummary?: string): string {
  if (bonusSummary) {
    return `As I understand it, the offer includes a base salary of ${formatMoney(offer)}, plus ${bonusSummary}.`;
  }
  return `As I understand it, the offer includes a base salary of ${formatMoney(offer)}.`;
}

// Section 3: Market/Value Framing
const VALUE_FRAMING = {
  external: {
    polite: (years: number, location: string) =>
      `Given my ${years} years of experience and the scope of this position, I took some time to compare the offer with typical ranges for similar roles in ${location}.`,
    professional: (years: number, location: string) =>
      `With ${years} years of experience and the responsibilities we discussed, I've reviewed current market ranges for similar roles in ${location}.`,
    aggressive: (years: number, location: string) =>
      `With ${years} years of experience and a strong track record of results, I've been comparing this offer to others I'm considering and to market rates for similar roles in ${location}.`,
  },
  internal_raise: {
    polite: (years: number, location: string) =>
      `Over my time here, I've taken on increasing responsibility and delivered consistent results. I've also looked at what similar roles are paying in ${location}.`,
    professional: (years: number, location: string) =>
      `Given my contributions over the past years and the scope of my current responsibilities, I've reviewed current market rates for comparable roles in ${location}.`,
    aggressive: (years: number, location: string) =>
      `Given my track record of results and the value I've delivered to the team, I've researched where my compensation stands relative to market rates for similar roles in ${location}.`,
  },
  retention: {
    polite: (years: number, location: string) =>
      `I've been reflecting on my contributions here and also looking at what similar roles are offering in ${location}.`,
    professional: (years: number, location: string) =>
      `I've evaluated both my contributions here and the current market for similar roles in ${location}.`,
    aggressive: (years: number, location: string) =>
      `I have concrete alternatives in the ${location} market, and I've been comparing those opportunities to my current situation.`,
  },
};

// Section 4: Market Gap Statement
function generateMarketGap(
  offer: number, 
  marketLow: number, 
  marketHigh: number, 
  isAboveMarket: boolean
): string {
  if (isAboveMarket) {
    return `From what I'm seeing, the offer is already competitive compared to typical ranges of ${formatMoney(marketLow)}–${formatMoney(marketHigh)}.`;
  }
  return `From what I'm seeing, a typical range for this kind of role is approximately ${formatMoney(marketLow)}–${formatMoney(marketHigh)}.`;
}

// Section 5: The Ask (driven by leverage + tone)
function generateAsk(
  tone: "polite" | "professional" | "aggressive",
  leverageTier: "low" | "moderate" | "high",
  targetAmount: number,
  isAboveMarket: boolean,
  comparisonRange?: string
): string {
  if (isAboveMarket) {
    // When offer is already competitive, suggest smaller adjustments or non-salary items
    const asks = {
      polite: `I'd love to explore a small adjustment to bring the base closer to ${formatMoney(targetAmount)}, or alternatively consider enhancements to equity, signing bonus, or other aspects of the package.`,
      professional: `I'd like to discuss a modest adjustment to ${formatMoney(targetAmount)}, or explore improvements to other components like equity or flexibility.`,
      aggressive: `I'm looking to get to ${formatMoney(targetAmount)} to close this out, or would consider enhanced equity or signing bonus as alternatives.`,
    };
    return asks[tone];
  }

  // Low leverage + Polite
  if (leverageTier === "low" && tone === "polite") {
    return `I'm very interested in joining the team, and I'm wondering if there might be flexibility to bring the base salary closer to ${formatMoney(targetAmount)} to better reflect that market range.`;
  }

  // Moderate leverage + Professional
  if (leverageTier === "moderate" && tone === "professional") {
    return `Based on this, I'd like to see if we can adjust the base salary to around ${formatMoney(targetAmount)}, which I believe is a fair reflection of my experience and the role's scope.`;
  }

  // High leverage + Aggressive
  if (leverageTier === "high" && tone === "aggressive") {
    const compRange = comparisonRange || `${formatMoney(targetAmount * 0.95)}–${formatMoney(targetAmount * 1.05)}`;
    return `Given this and the other opportunities I'm evaluating in the ${compRange} band, I'm looking for a base salary in the neighborhood of ${formatMoney(targetAmount)} to feel comfortable moving forward quickly.`;
  }

  // Mixed combinations
  const askTemplates = {
    polite: {
      low: `I was wondering if there might be any flexibility in the base salary. Would it be possible to explore something closer to ${formatMoney(targetAmount)}?`,
      moderate: `I'd appreciate it if we could explore bringing the offer closer to ${formatMoney(targetAmount)} to better align with market rates.`,
      high: `Given my situation, I'd like to explore a base salary closer to ${formatMoney(targetAmount)}. I'm hopeful we can find a number that works for both of us.`,
    },
    professional: {
      low: `I'd like to discuss whether there's room to move the base salary closer to ${formatMoney(targetAmount)}.`,
      moderate: `Based on my research, I believe a base salary around ${formatMoney(targetAmount)} would be more aligned with my experience and market rates.`,
      high: `I'm looking for a base salary in the range of ${formatMoney(targetAmount)}. Is there room to get there?`,
    },
    aggressive: {
      low: `Given market data, I believe ${formatMoney(targetAmount)} would be a fair base salary for this role.`,
      moderate: `I'm targeting a base salary of ${formatMoney(targetAmount)} based on my experience and what I'm seeing in the market.`,
      high: `I expect a base salary of at least ${formatMoney(targetAmount)}. If we can get there, I'd be comfortable signing quickly.`,
    },
  };

  return askTemplates[tone][leverageTier];
}

// Section 6: Risk/Collaboration Line
const COLLABORATION_PHRASES = {
  polite: "I'm definitely flexible and open to discussing what's possible on your end.",
  professional: "I'm happy to talk through what's feasible and find a number that works for both of us.",
  aggressive: "If there's room to get to that level, I'd be excited to move ahead and wrap this up quickly.",
};

// Section 7: Closing Sentence
const CLOSING_PHRASES = {
  polite: "Thank you again for the offer and for considering this adjustment.",
  professional: "Thanks again for the offer and for taking the time to review this.",
  aggressive: "I appreciate your consideration and I'm looking forward to hearing what might be possible.",
};

// Calculate target ask amount based on leverage, tone, and market position
function calculateTargetAmount(
  currentOffer: number,
  leverageTier: "low" | "moderate" | "high",
  tone: "polite" | "professional" | "aggressive",
  suggestedMinPercent: number,
  suggestedMaxPercent: number,
  explicitAsk?: number
): number {
  if (explicitAsk) return explicitAsk;

  const midPercent = (suggestedMinPercent + suggestedMaxPercent) / 2;

  // Polite + Low leverage: use min percentage
  if (tone === "polite" && leverageTier === "low") {
    return Math.round(currentOffer * (1 + suggestedMinPercent / 100));
  }

  // Professional + Moderate leverage: use mid percentage
  if (tone === "professional" && leverageTier === "moderate") {
    return Math.round(currentOffer * (1 + midPercent / 100));
  }

  // Aggressive + High leverage: use max percentage
  if (tone === "aggressive" && leverageTier === "high") {
    return Math.round(currentOffer * (1 + suggestedMaxPercent / 100));
  }

  // Mixed combinations - interpolate
  const toneMultiplier = { polite: 0.3, professional: 0.5, aggressive: 0.8 };
  const leverageMultiplier = { low: 0.3, moderate: 0.5, high: 0.8 };
  
  const combinedFactor = (toneMultiplier[tone] + leverageMultiplier[leverageTier]) / 2;
  const targetPercent = suggestedMinPercent + (suggestedMaxPercent - suggestedMinPercent) * combinedFactor;
  
  return Math.round(currentOffer * (1 + targetPercent / 100));
}

export function generateNegotiationScript(context: ScriptContext): { body: string; targetAmount: number } {
  const {
    tone,
    jobTitle,
    companyName = "the company",
    yearsExperience,
    location,
    currentOffer,
    bonusSummary,
    marketRangeLow,
    marketRangeHigh,
    marketMedian,
    leverageTier,
    suggestedRangeMinPercent,
    suggestedRangeMaxPercent,
    scenarioType,
    askAmount,
  } = context;

  // Determine if offer is already above market
  const isAboveMarket = currentOffer >= marketMedian;

  // Calculate target amount
  const targetAmount = calculateTargetAmount(
    currentOffer,
    leverageTier,
    tone,
    isAboveMarket ? Math.max(2, suggestedRangeMinPercent / 2) : suggestedRangeMinPercent,
    isAboveMarket ? Math.max(5, suggestedRangeMaxPercent / 2) : suggestedRangeMaxPercent,
    askAmount
  );

  // Build the 7 sections
  const sections: string[] = [];

  // Section 1: Gratitude & Enthusiasm
  sections.push(GRATITUDE_PHRASES[scenarioType][tone](companyName, jobTitle));

  // Section 2: Offer Recap (only for external offers)
  if (scenarioType === "external") {
    sections.push(generateOfferRecap(currentOffer, bonusSummary));
  }

  // Section 3: Market/Value Framing
  sections.push(VALUE_FRAMING[scenarioType][tone](yearsExperience, location));

  // Section 4: State the Market Gap (skip if offer is above market - don't mention numbers)
  if (!isAboveMarket) {
    sections.push(generateMarketGap(currentOffer, marketRangeLow, marketRangeHigh, isAboveMarket));
  }

  // Section 5: The Ask
  sections.push(generateAsk(tone, leverageTier, targetAmount, isAboveMarket));

  // Section 6: Risk/Collaboration Line
  sections.push(COLLABORATION_PHRASES[tone]);

  // Section 7: Closing
  sections.push(CLOSING_PHRASES[tone]);

  // Combine sections with proper paragraph breaks
  const body = sections.join("\n\n");

  return { body, targetAmount };
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
