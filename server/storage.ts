import { 
  compensationRecords, 
  type CompensationRecord, 
  type InsertCompensationRecord,
  type QueryCompensation 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, or, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Compensation Records
  getCompensationRecords(query: QueryCompensation): Promise<{ records: CompensationRecord[], total: number }>;
  getCompensationRecordById(id: number): Promise<CompensationRecord | undefined>;
  createCompensationRecord(record: InsertCompensationRecord): Promise<CompensationRecord>;
  bulkCreateCompensationRecords(records: InsertCompensationRecord[]): Promise<CompensationRecord[]>;
  
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
}

export class DatabaseStorage implements IStorage {
  async getCompensationRecords(query: QueryCompensation): Promise<{ records: CompensationRecord[], total: number }> {
    const conditions = [];
    
    if (query.search) {
      conditions.push(
        or(
          like(compensationRecords.jobTitle, `%${query.search}%`),
          like(compensationRecords.industryNaics, `%${query.search}%`)
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
}

export const storage = new DatabaseStorage();
