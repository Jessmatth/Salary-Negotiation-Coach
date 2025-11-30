import { pgTable, text, serial, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Compensation Records Table (existing - for market data)
export const compensationRecords = pgTable("compensation_records", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull().unique(),
  
  jobTitle: text("job_title").notNull(),
  socCode: text("soc_code").notNull(),
  industryNaics: text("industry_naics").notNull(),
  companySize: text("company_size").notNull(),
  companyType: text("company_type").notNull(),
  
  state: text("state").notNull(),
  msa: text("msa").notNull(),
  costOfLivingIndex: real("cost_of_living_index").notNull(),
  remoteEligibility: boolean("remote_eligibility").notNull().default(false),
  
  baseSalaryMin: integer("base_salary_min").notNull(),
  baseSalaryMedian: integer("base_salary_median").notNull(),
  baseSalaryMax: integer("base_salary_max").notNull(),
  totalCompMedian: integer("total_comp_median").notNull(),
  currency: text("currency").notNull().default("USD"),
  payType: text("pay_type").notNull().default("Salary"),
  dataYear: integer("data_year").notNull().default(2024),
  
  minYearsExperience: integer("min_years_experience").notNull(),
  educationLevel: text("education_level").notNull(),
  skills: text("skills").array().notNull().default([]),
  managementLevel: text("management_level").notNull(),
  
  dataSource: text("data_source").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  sampleSize: integer("sample_size").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Offer Evaluations Table - stores user scorecard sessions
export const offerEvaluations = pgTable("offer_evaluations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  
  jobTitle: text("job_title").notNull(),
  companyName: text("company_name"),
  yearsExperience: integer("years_experience").notNull(),
  seniorityLevel: text("seniority_level").notNull(),
  location: text("location").notNull(),
  isRemote: boolean("is_remote").default(false),
  
  baseSalaryOffered: integer("base_salary_offered").notNull(),
  bonusPercent: real("bonus_percent"),
  equityDetails: text("equity_details"),
  
  marketMin: integer("market_min"),
  marketMedian: integer("market_median"),
  marketMax: integer("market_max"),
  differenceFromMarket: integer("difference_from_market"),
  percentilePosition: real("percentile_position"),
  
  leverageScore: integer("leverage_score"),
  leverageTier: text("leverage_tier"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Quiz Responses Table - stores leverage quiz answers
export const quizResponses = pgTable("quiz_responses", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  evaluationId: integer("evaluation_id"),
  
  otherOffers: text("other_offers").notNull(),
  companyUrgency: text("company_urgency").notNull(),
  skillUniqueness: text("skill_uniqueness").notNull(),
  employmentStatus: text("employment_status").notNull(),
  pipelineProgress: text("pipeline_progress").notNull(),
  managerInvestment: text("manager_investment").notNull(),
  companyFinancials: text("company_financials").notNull(),
  willingnessToWalk: text("willingness_to_walk").notNull(),
  
  leverageScore: integer("leverage_score").notNull(),
  leverageTier: text("leverage_tier").notNull(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User Feedback Table - stores thumbs up/down feedback
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  feedbackType: text("feedback_type").notNull(), // "scorecard" or "script"
  rating: text("rating").notNull(), // "up" or "down"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod Schemas for existing compensation records
export const insertCompensationRecordSchema = createInsertSchema(compensationRecords).omit({
  id: true,
  createdAt: true,
});
export const selectCompensationRecordSchema = createSelectSchema(compensationRecords);
export type CompensationRecord = typeof compensationRecords.$inferSelect;
export type InsertCompensationRecord = z.infer<typeof insertCompensationRecordSchema>;

// Scorecard Input Schema
export const scorecardInputSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().optional(),
  yearsExperience: z.coerce.number().min(0).max(40),
  seniorityLevel: z.enum(["Junior", "Mid", "Senior", "Lead", "Director", "VP", "C-Suite"]),
  location: z.string().min(1, "Location is required"),
  isRemote: z.boolean().default(false),
  baseSalaryOffered: z.coerce.number().min(20000).max(2000000),
  bonusPercent: z.coerce.number().min(0).max(100).optional().nullable().transform(v => v ?? undefined),
  equityDetails: z.string().optional(),
});
export type ScorecardInput = z.infer<typeof scorecardInputSchema>;

// Scorecard Result Schema
export const scorecardResultSchema = z.object({
  sessionId: z.string(),
  input: scorecardInputSchema,
  marketRange: z.object({
    min: z.number(),
    p25: z.number(),
    median: z.number(),
    p75: z.number(),
    max: z.number(),
  }),
  position: z.object({
    percentile: z.number(),
    zone: z.enum(["very_underpaid", "underpaid", "fair", "above_market", "well_above_market"]),
    difference: z.number(),
    differencePercent: z.number(),
  }),
  narrative: z.string(),
  sampleSize: z.number(),
  confidence: z.number(),
});
export type ScorecardResult = z.infer<typeof scorecardResultSchema>;

// Leverage Quiz Input Schema
export const leverageQuizInputSchema = z.object({
  otherOffers: z.enum(["none", "one", "two", "three_plus"]),
  companyUrgency: z.enum(["urgent", "normal", "no_rush"]),
  skillUniqueness: z.enum(["many_qualified", "some_unique", "rare_critical"]),
  employmentStatus: z.enum(["unemployed", "employed_looking", "employed_happy", "retention_offer"]),
  pipelineProgress: z.enum(["not_interviewing", "early_stages", "final_rounds", "deadlines_approaching"]),
  managerInvestment: z.enum(["very_invested", "moderately_interested", "standard_process"]),
  companyFinancials: z.enum(["struggling", "stable", "growing_funded"]),
  willingnessToWalk: z.enum(["need_this_job", "prefer_but_options", "genuinely_indifferent"]),
});
export type LeverageQuizInput = z.infer<typeof leverageQuizInputSchema>;

// Leverage Result Schema
export const leverageResultSchema = z.object({
  score: z.number().min(0).max(100),
  tier: z.enum(["low", "moderate", "high"]),
  tierLabel: z.string(),
  tagline: z.string(),
  tactics: z.array(z.string()),
  suggestedRange: z.object({
    minPercent: z.number(),
    maxPercent: z.number(),
    minDollars: z.number().optional(),
    maxDollars: z.number().optional(),
  }),
  riskAssessment: z.string(),
});
export type LeverageResult = z.infer<typeof leverageResultSchema>;

// Script Generator Input Schema
export const scriptInputSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string().optional(),
  yearsExperience: z.coerce.number(),
  location: z.string(),
  currentOffer: z.coerce.number(),
  bonusSummary: z.string().optional(),
  marketRangeLow: z.coerce.number(),
  marketRangeHigh: z.coerce.number(),
  marketMedian: z.coerce.number(),
  leverageTier: z.enum(["low", "moderate", "high"]).default("moderate"),
  suggestedRangeMinPercent: z.coerce.number().default(5),
  suggestedRangeMaxPercent: z.coerce.number().default(15),
  scenarioType: z.enum(["external", "internal_raise", "retention"]).default("external"),
  tone: z.enum(["polite", "professional", "aggressive"]),
  askAmount: z.coerce.number().optional().nullable().transform(v => (v === null || v === undefined || Number.isNaN(v)) ? undefined : v),
});
export type ScriptInput = z.infer<typeof scriptInputSchema>;

// Script Result Schema
export const scriptResultSchema = z.object({
  body: z.string(),
  tone: z.enum(["polite", "professional", "aggressive"]),
  targetAmount: z.number(),
  contextSummary: z.string(),
});
export type ScriptResult = z.infer<typeof scriptResultSchema>;

// Feedback Input Schema
export const feedbackInputSchema = z.object({
  sessionId: z.string(),
  feedbackType: z.enum(["scorecard", "script"]),
  rating: z.enum(["up", "down"]),
});
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

// Legacy query schemas (kept for backward compatibility)
export const queryCompensationSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  state: z.string().optional(),
  managementLevel: z.string().optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  limit: z.number().min(1).max(500).default(100),
  offset: z.number().min(0).default(0),
});

export const benchmarkRequestSchema = z.object({
  jobTitle: z.string().min(1),
  industry: z.string().min(1),
  location: z.string().min(1),
  experience: z.number().min(0).max(30),
  level: z.string().min(1),
});

export type QueryCompensation = z.infer<typeof queryCompensationSchema>;
export type BenchmarkRequest = z.infer<typeof benchmarkRequestSchema>;

// Quiz question definitions (for frontend)
export const LEVERAGE_QUESTIONS = [
  {
    id: "otherOffers",
    question: "How many other offers do you currently have?",
    options: [
      { value: "none", label: "None" },
      { value: "one", label: "1" },
      { value: "two", label: "2" },
      { value: "three_plus", label: "3+" },
    ],
  },
  {
    id: "companyUrgency",
    question: "How badly does this company need to fill this role?",
    options: [
      { value: "urgent", label: "They mentioned urgent need" },
      { value: "normal", label: "Normal timeline" },
      { value: "no_rush", label: "They said \"no rush\"" },
    ],
  },
  {
    id: "skillUniqueness",
    question: "How unique are your skills for this position?",
    options: [
      { value: "many_qualified", label: "I'm one of many qualified candidates" },
      { value: "some_unique", label: "I have some unique qualifications" },
      { value: "rare_critical", label: "I have rare, critical skills" },
    ],
  },
  {
    id: "employmentStatus",
    question: "What's your current employment status?",
    options: [
      { value: "unemployed", label: "Unemployed" },
      { value: "employed_looking", label: "Employed but looking" },
      { value: "employed_happy", label: "Employed and happy" },
      { value: "retention_offer", label: "Employed with retention offer" },
    ],
  },
  {
    id: "pipelineProgress",
    question: "How far along are you with other companies?",
    options: [
      { value: "not_interviewing", label: "Not interviewing elsewhere" },
      { value: "early_stages", label: "Early stages" },
      { value: "final_rounds", label: "Final rounds" },
      { value: "deadlines_approaching", label: "Have deadlines approaching" },
    ],
  },
  {
    id: "managerInvestment",
    question: "Does the hiring manager seem personally invested?",
    options: [
      { value: "very_invested", label: "Very invested (multiple calls, selling me)" },
      { value: "moderately_interested", label: "Moderately interested" },
      { value: "standard_process", label: "Following standard process" },
    ],
  },
  {
    id: "companyFinancials",
    question: "How does this company's financial situation look?",
    options: [
      { value: "struggling", label: "Recent layoffs or struggles" },
      { value: "stable", label: "Stable" },
      { value: "growing_funded", label: "Growing rapidly with funding" },
    ],
  },
  {
    id: "willingnessToWalk",
    question: "How willing are you to walk away?",
    options: [
      { value: "need_this_job", label: "I need this job" },
      { value: "prefer_but_options", label: "I'd prefer this but have options" },
      { value: "genuinely_indifferent", label: "I'm genuinely indifferent" },
    ],
  },
] as const;
