import { 
  compensationRecords, 
  offerEvaluations,
  quizResponses,
  scriptSessions,
  userFeedback,
  users,
  type CompensationRecord, 
  type InsertCompensationRecord,
  type QueryCompensation,
  type ScorecardInput,
  type FeedbackInput,
  type User,
  type UpsertUser,
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
  
  // Script Sessions
  saveScriptSession(data: any): Promise<any>;
  
  // User Feedback
  saveFeedback(data: FeedbackInput): Promise<any>;
  
  // User Operations (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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
    // Strategy: Try progressively broader searches until we get enough data
    // 1. Exact title match + location
    // 2. Fuzzy title match + location  
    // 3. Fuzzy title match only
    // 4. Fallback with low confidence
    
    const titleWords = input.jobTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    // Extract state from location
    let stateCode: string | null = null;
    if (!input.isRemote && input.location) {
      const stateMatch = input.location.match(/\b([A-Z]{2})\b/);
      if (stateMatch) {
        stateCode = stateMatch[1];
      }
    }
    
    // Helper to run percentile query
    const runQuery = async (conditions: any[]) => {
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
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
      return result;
    };
    
    // Try 1: Fuzzy title match with location
    if (titleWords.length > 0 && stateCode) {
      const titleConditions = titleWords.map(word => 
        ilike(compensationRecords.jobTitle, `%${word}%`)
      );
      const result = await runQuery([
        or(...titleConditions),
        eq(compensationRecords.state, stateCode)
      ]);
      
      if (result && result.sampleSize >= 5) {
        // Strong match: title + location
        const confidence = Math.min(0.95, 0.7 + (result.sampleSize / 200) * 0.25);
        return { ...result, confidence };
      }
    }
    
    // Try 2: Fuzzy title match only (no location filter)
    if (titleWords.length > 0) {
      const titleConditions = titleWords.map(word => 
        ilike(compensationRecords.jobTitle, `%${word}%`)
      );
      const result = await runQuery([or(...titleConditions)]);
      
      if (result && result.sampleSize >= 3) {
        // Medium match: title only
        const confidence = Math.min(0.85, 0.5 + (result.sampleSize / 300) * 0.35);
        return { ...result, confidence };
      }
    }
    
    // Try 3: Exact job title match (case insensitive)
    const exactResult = await runQuery([
      ilike(compensationRecords.jobTitle, input.jobTitle)
    ]);
    
    if (exactResult && exactResult.sampleSize >= 1) {
      const confidence = Math.min(0.9, 0.6 + (exactResult.sampleSize / 100) * 0.3);
      return { ...exactResult, confidence };
    }
    
    // Fallback: No matching data found
    // Return general market data with very low confidence and sample size of 0
    const [broadResult] = await db
      .select({
        min: sql<number>`COALESCE(percentile_cont(0.10) within group (order by ${compensationRecords.baseSalaryMedian})::int, 70000)`,
        p25: sql<number>`COALESCE(percentile_cont(0.25) within group (order by ${compensationRecords.baseSalaryMedian})::int, 85000)`,
        median: sql<number>`COALESCE(percentile_cont(0.50) within group (order by ${compensationRecords.baseSalaryMedian})::int, 100000)`,
        p75: sql<number>`COALESCE(percentile_cont(0.75) within group (order by ${compensationRecords.baseSalaryMedian})::int, 130000)`,
        max: sql<number>`COALESCE(percentile_cont(0.90) within group (order by ${compensationRecords.baseSalaryMedian})::int, 175000)`,
      })
      .from(compensationRecords);
    
    return {
      min: broadResult?.min || 70000,
      p25: broadResult?.p25 || 85000,
      median: broadResult?.median || 100000,
      p75: broadResult?.p75 || 130000,
      max: broadResult?.max || 175000,
      sampleSize: 0, // No specific matches found
      confidence: 0.2, // Very low confidence for fallback
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
  
  async saveScriptSession(data: any): Promise<any> {
    const [saved] = await db
      .insert(scriptSessions)
      .values(data)
      .returning();
    return saved;
  }
  
  async saveFeedback(data: FeedbackInput): Promise<any> {
    const [saved] = await db
      .insert(userFeedback)
      .values(data)
      .returning();
    return saved;
  }
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
