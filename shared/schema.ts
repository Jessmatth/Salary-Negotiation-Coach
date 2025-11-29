import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Compensation Records Table
export const compensationRecords = pgTable("compensation_records", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull().unique(),
  
  // Job Information
  jobTitle: text("job_title").notNull(),
  socCode: text("soc_code").notNull(),
  industryNaics: text("industry_naics").notNull(),
  companySize: text("company_size").notNull(), // "1-50" | "51-200" | "201-1000" | "1000+"
  companyType: text("company_type").notNull(), // "Public" | "Private" | "Nonprofit" | "Government"
  
  // Location
  state: text("state").notNull(),
  msa: text("msa").notNull(),
  costOfLivingIndex: real("cost_of_living_index").notNull(),
  remoteEligibility: boolean("remote_eligibility").notNull().default(false),
  
  // Compensation
  baseSalaryMin: integer("base_salary_min").notNull(),
  baseSalaryMedian: integer("base_salary_median").notNull(),
  baseSalaryMax: integer("base_salary_max").notNull(),
  totalCompMedian: integer("total_comp_median").notNull(),
  currency: text("currency").notNull().default("USD"),
  payType: text("pay_type").notNull().default("Salary"), // "Hourly" | "Salary"
  dataYear: integer("data_year").notNull().default(2024),
  
  // Requirements
  minYearsExperience: integer("min_years_experience").notNull(),
  educationLevel: text("education_level").notNull(), // "High School" | "Associate" | "Bachelor" | "Master" | "PhD"
  skills: text("skills").array().notNull().default([]),
  managementLevel: text("management_level").notNull(), // "IC" | "Manager" | "Director" | "VP" | "C-suite"
  
  // Meta
  dataSource: text("data_source").notNull(), // "BLS" | "H1B" | "Glassdoor" | "Levels.fyi" | "Payscale"
  confidenceScore: real("confidence_score").notNull(),
  sampleSize: integer("sample_size").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod Schemas
export const insertCompensationRecordSchema = createInsertSchema(compensationRecords).omit({
  id: true,
  createdAt: true,
});

export const selectCompensationRecordSchema = createSelectSchema(compensationRecords);

// Types
export type CompensationRecord = typeof compensationRecords.$inferSelect;
export type InsertCompensationRecord = z.infer<typeof insertCompensationRecordSchema>;

// Query schemas for API validation
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
