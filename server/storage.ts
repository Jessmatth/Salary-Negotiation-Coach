import { 
  compensationRecords, 
  offerEvaluations,
  quizResponses,
  type CompensationRecord, 
  type InsertCompensationRecord,
  type QueryCompensation,
  type ScorecardInput,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, or, sql, desc, ilike } from "drizzle-orm";

export interface MarketRange {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  sampleSize: number;
  confidence: number;
}

export interface IStorage {
  // Compensation Records
  getCompensationRecords(query: QueryCompensation): Promise<{ records: CompensationRecord[], total: number }>;
  getCompensationRecordById(id: number): Promise<CompensationRecord | undefined>;
  createCompensationRecord(record: InsertCompensationRecord): Promise<CompensationRecord>;
  bulkCreateCompensationRecords(records: InsertCompensationRecord[]): Promise<CompensationRecord[]>;
  
  // Market Range for Scorecard
  getMarketRange(input: ScorecardInput): Promise<MarketRange>;
  getJobTitleSuggestions(query: string): Promise<string[]>;
  
  // Analytics
  getAggregateStats(): Promise<{
    totalRecords: number;
    avgSalary: number;
    uniqueRoles: number;
    uniqueIndustries: number;
  }>;
  getSalaryByRole(): Promise<Array<{ name: string; salary: number }>>;
  getIndustryDistribution(): Promise<Array<{ name: string; value: number }>>;
  getRecentRecords(limit: number): Promise<CompensationRecord[]>;
  
  // Offer Evaluations
  saveOfferEvaluation(data: any): Promise<any>;
  
  // Quiz Responses  
  saveQuizResponse(data: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getCompensationRecords(query: QueryCompensation): Promise<{ records: CompensationRecord[], total: number }> {
    const conditions = [];
    
    if (query.search) {
      conditions.push(
        or(
          ilike(compensationRecords.jobTitle, `%${query.search}%`),
          ilike(compensationRecords.industryNaics, `%${query.search}%`)
        )
      );
    }
    
    if (query.industry) {
      conditions.push(eq(compensationRecords.industryNaics, query.industry));
    }
    
    if (query.state) {
      conditions.push(eq(compensationRecords.state, query.state));
    }
    
    if (query.managementLevel) {
      conditions.push(eq(compensationRecords.managementLevel, query.managementLevel));
    }
    
    if (query.minSalary) {
      conditions.push(gte(compensationRecords.baseSalaryMedian, query.minSalary));
    }
    
    if (query.maxSalary) {
      conditions.push(lte(compensationRecords.baseSalaryMedian, query.maxSalary));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [records, countResult] = await Promise.all([
      db
        .select()
        .from(compensationRecords)
        .where(whereClause)
        .limit(query.limit || 100)
        .offset(query.offset || 0)
        .orderBy(desc(compensationRecords.lastUpdated)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(compensationRecords)
        .where(whereClause)
    ]);
    
    return {
      records,
      total: countResult[0]?.count || 0
    };
  }
  
  async getCompensationRecordById(id: number): Promise<CompensationRecord | undefined> {
    const [record] = await db
      .select()
      .from(compensationRecords)
      .where(eq(compensationRecords.id, id));
    return record || undefined;
  }
  
  async createCompensationRecord(record: InsertCompensationRecord): Promise<CompensationRecord> {
    const [created] = await db
      .insert(compensationRecords)
      .values(record)
      .returning();
    return created;
  }
  
  async bulkCreateCompensationRecords(records: InsertCompensationRecord[]): Promise<CompensationRecord[]> {
    if (records.length === 0) return [];
    
    const created = await db
      .insert(compensationRecords)
      .values(records)
      .returning();
    return created;
  }
  
  async getMarketRange(input: ScorecardInput): Promise<MarketRange> {
    // Build conditions for finding comparable salaries
    const conditions = [];
    
    // Match job title (fuzzy)
    const titleWords = input.jobTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (titleWords.length > 0) {
      const titleConditions = titleWords.map(word => 
        ilike(compensationRecords.jobTitle, `%${word}%`)
      );
      conditions.push(or(...titleConditions));
    }
    
    // Match state/location if not remote
    if (!input.isRemote && input.location) {
      const stateMatch = input.location.match(/\b([A-Z]{2})\b/);
      if (stateMatch) {
        conditions.push(eq(compensationRecords.state, stateMatch[1]));
      }
    }
    
    // Experience range (within 3 years)
    const expMin = Math.max(0, input.yearsExperience - 3);
    const expMax = input.yearsExperience + 3;
    conditions.push(gte(compensationRecords.minYearsExperience, expMin));
    conditions.push(lte(compensationRecords.minYearsExperience, expMax));
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get percentile data
    const [result] = await db
      .select({
        min: sql<number>`COALESCE(percentile_cont(0.10) within group (order by ${compensationRecords.baseSalaryMedian})::int, 0)`,
        p25: sql<number>`COALESCE(percentile_cont(0.25) within group (order by ${compensationRecords.baseSalaryMedian})::int, 0)`,
        median: sql<number>`COALESCE(percentile_cont(0.50) within group (order by ${compensationRecords.baseSalaryMedian})::int, 0)`,
        p75: sql<number>`COALESCE(percentile_cont(0.75) within group (order by ${compensationRecords.baseSalaryMedian})::int, 0)`,
        max: sql<number>`COALESCE(percentile_cont(0.90) within group (order by ${compensationRecords.baseSalaryMedian})::int, 0)`,
        sampleSize: sql<number>`count(*)::int`,
      })
      .from(compensationRecords)
      .where(whereClause);
    
    // If no matches found, try broader search
    if (!result || result.sampleSize === 0) {
      const [broadResult] = await db
        .select({
          min: sql<number>`COALESCE(percentile_cont(0.10) within group (order by ${compensationRecords.baseSalaryMedian})::int, 70000)`,
          p25: sql<number>`COALESCE(percentile_cont(0.25) within group (order by ${compensationRecords.baseSalaryMedian})::int, 85000)`,
          median: sql<number>`COALESCE(percentile_cont(0.50) within group (order by ${compensationRecords.baseSalaryMedian})::int, 100000)`,
          p75: sql<number>`COALESCE(percentile_cont(0.75) within group (order by ${compensationRecords.baseSalaryMedian})::int, 130000)`,
          max: sql<number>`COALESCE(percentile_cont(0.90) within group (order by ${compensationRecords.baseSalaryMedian})::int, 175000)`,
          sampleSize: sql<number>`count(*)::int`,
        })
        .from(compensationRecords);
      
      return {
        min: broadResult?.min || 70000,
        p25: broadResult?.p25 || 85000,
        median: broadResult?.median || 100000,
        p75: broadResult?.p75 || 130000,
        max: broadResult?.max || 175000,
        sampleSize: broadResult?.sampleSize || 100,
        confidence: 0.5, // Lower confidence for broad match
      };
    }
    
    // Calculate confidence based on sample size
    const confidence = Math.min(0.95, 0.5 + (result.sampleSize / 1000) * 0.45);
    
    return {
      min: result.min,
      p25: result.p25,
      median: result.median,
      p75: result.p75,
      max: result.max,
      sampleSize: result.sampleSize,
      confidence,
    };
  }
  
  async getJobTitleSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    
    const results = await db
      .selectDistinct({ title: compensationRecords.jobTitle })
      .from(compensationRecords)
      .where(ilike(compensationRecords.jobTitle, `%${query}%`))
      .limit(10);
    
    return results.map(r => r.title);
  }
  
  async getAggregateStats(): Promise<{
    totalRecords: number;
    avgSalary: number;
    uniqueRoles: number;
    uniqueIndustries: number;
  }> {
    const [stats] = await db
      .select({
        totalRecords: sql<number>`count(*)::int`,
        avgSalary: sql<number>`avg(${compensationRecords.baseSalaryMedian})::int`,
        uniqueRoles: sql<number>`count(distinct ${compensationRecords.jobTitle})::int`,
        uniqueIndustries: sql<number>`count(distinct ${compensationRecords.industryNaics})::int`,
      })
      .from(compensationRecords);
    
    return stats || { totalRecords: 0, avgSalary: 0, uniqueRoles: 0, uniqueIndustries: 0 };
  }
  
  async getSalaryByRole(): Promise<Array<{ name: string; salary: number }>> {
    const results = await db
      .select({
        name: compensationRecords.jobTitle,
        salary: sql<number>`avg(${compensationRecords.baseSalaryMedian})::int`,
      })
      .from(compensationRecords)
      .groupBy(compensationRecords.jobTitle)
      .orderBy(desc(sql`avg(${compensationRecords.baseSalaryMedian})`))
      .limit(5);
    
    return results;
  }
  
  async getIndustryDistribution(): Promise<Array<{ name: string; value: number }>> {
    const results = await db
      .select({
        name: compensationRecords.industryNaics,
        value: sql<number>`count(*)::int`,
      })
      .from(compensationRecords)
      .groupBy(compensationRecords.industryNaics);
    
    return results;
  }
  
  async getRecentRecords(limit: number = 5): Promise<CompensationRecord[]> {
    return db
      .select()
      .from(compensationRecords)
      .orderBy(desc(compensationRecords.lastUpdated))
      .limit(limit);
  }
  
  async saveOfferEvaluation(data: any): Promise<any> {
    const [saved] = await db
      .insert(offerEvaluations)
      .values(data)
      .returning();
    return saved;
  }
  
  async saveQuizResponse(data: any): Promise<any> {
    const [saved] = await db
      .insert(quizResponses)
      .values(data)
      .returning();
    return saved;
  }
}

export const storage = new DatabaseStorage();
