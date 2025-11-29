import { db } from "./db";
import { compensationRecords } from "@shared/schema";
import type { InsertCompensationRecord } from "@shared/schema";
import * as fs from "fs";
import * as readline from "readline";

// Cost of living multipliers by state
const STATE_COL: Record<string, number> = {
  CA: 145, NY: 138, WA: 128, MA: 125, CO: 118, VA: 122, DC: 130,
  TX: 108, FL: 112, GA: 105, NC: 102, IL: 115, PA: 110, NJ: 125,
  AZ: 105, OR: 120, MD: 118, CT: 120, MN: 108, OH: 98, MI: 100,
};

// Parse wage string to annual number
function parseWage(wage: string, unit: string): number | null {
  if (!wage) return null;
  const cleaned = wage.replace(/[$,\s]/g, "");
  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  
  if (unit?.toLowerCase().includes("hour")) {
    return Math.round(value * 2080); // 40 hrs * 52 weeks
  } else if (unit?.toLowerCase().includes("month")) {
    return Math.round(value * 12);
  }
  return Math.round(value);
}

// Get management level from wage level
function getManagementLevel(wageLevel: string, title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("director") || titleLower.includes("vp") || titleLower.includes("vice president")) return "Director";
  if (titleLower.includes("manager") || titleLower.includes("lead") || titleLower.includes("senior manager")) return "Manager";
  if (titleLower.includes("senior") || titleLower.includes("staff") || titleLower.includes("principal")) return "IC";
  if (wageLevel === "IV" || wageLevel === "III") return "IC";
  return "IC";
}

// Get experience years from wage level
function getExperienceYears(wageLevel: string, title: string): number {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("principal") || titleLower.includes("staff")) return 10;
  if (titleLower.includes("senior")) return 5;
  if (titleLower.includes("director")) return 12;
  if (titleLower.includes("manager")) return 7;
  if (wageLevel === "IV") return 8;
  if (wageLevel === "III") return 5;
  if (wageLevel === "II") return 3;
  return 1;
}

// Get education level
function getEducationLevel(socCode: string, title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("phd") || titleLower.includes("scientist") || titleLower.includes("research")) return "PhD";
  if (titleLower.includes("engineer") || titleLower.includes("developer") || titleLower.includes("analyst")) return "Bachelor";
  if (socCode.startsWith("15-") || socCode.startsWith("17-")) return "Bachelor";
  if (socCode.startsWith("11-")) return "Master";
  return "Bachelor";
}

// Get skills based on SOC code and title
function getSkills(socCode: string, title: string): string[] {
  const titleLower = title.toLowerCase();
  
  if (socCode.startsWith("15-1252") || titleLower.includes("software")) {
    return ["JavaScript", "Python", "SQL", "Git", "React", "Node.js"];
  }
  if (socCode.startsWith("15-2051") || titleLower.includes("data scientist")) {
    return ["Python", "SQL", "Machine Learning", "Statistics", "TensorFlow"];
  }
  if (socCode.startsWith("15-1242") || titleLower.includes("database")) {
    return ["SQL", "PostgreSQL", "Oracle", "Data Modeling", "Performance Tuning"];
  }
  if (socCode.startsWith("11-3021") || titleLower.includes("manager")) {
    return ["Leadership", "Project Management", "Strategy", "Budgeting"];
  }
  if (socCode.startsWith("17-")) {
    return ["Engineering", "Technical Design", "Problem Solving", "CAD"];
  }
  return ["Communication", "Problem Solving", "Teamwork"];
}

// Get industry from SOC code
function getIndustry(socCode: string): string {
  if (socCode.startsWith("15-")) return "Technology";
  if (socCode.startsWith("11-")) return "Management";
  if (socCode.startsWith("13-")) return "Finance";
  if (socCode.startsWith("17-")) return "Engineering";
  if (socCode.startsWith("19-")) return "Healthcare";
  if (socCode.startsWith("29-")) return "Healthcare";
  if (socCode.startsWith("27-")) return "Media";
  return "Other";
}

async function importH1BData(filePath: string, limit: number = 50000): Promise<InsertCompensationRecord[]> {
  console.log("📊 Importing H1B data...");
  const records: InsertCompensationRecord[] = [];
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;
  let lineCount = 0;
  let headers: string[] = [];

  for await (const line of rl) {
    if (isFirstLine) {
      // Handle BOM and parse headers
      headers = line.replace(/^\uFEFF/, "").split(",").map(h => h.trim());
      isFirstLine = false;
      continue;
    }

    if (lineCount >= limit) break;
    
    try {
      // Parse CSV line (handling quoted fields)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });

      const jobTitle = row["JOB_TITLE"];
      const socCode = row["SOC_CODE"];
      const state = row["WORKSITE_STATE"];
      const city = row["WORKSITE_CITY"];
      const wageFrom = row["WAGE_RATE_OF_PAY_FROM"];
      const wageTo = row["WAGE_RATE_OF_PAY_TO"];
      const wageUnit = row["WAGE_UNIT_OF_PAY"];
      const prevailingWage = row["PREVAILING_WAGE"];
      const pwUnit = row["PW_UNIT_OF_PAY"];
      const wageLevel = row["PW_WAGE_LEVEL"];

      // Skip invalid records
      if (!jobTitle || !socCode || !state || !wageFrom) continue;
      
      const baseSalary = parseWage(wageFrom, wageUnit);
      const maxSalary = wageTo ? parseWage(wageTo, wageUnit) : null;
      const prevWage = parseWage(prevailingWage, pwUnit);
      
      if (!baseSalary || baseSalary < 30000 || baseSalary > 1000000) continue;

      const colIndex = STATE_COL[state] || 100;
      const baseSalaryMedian = baseSalary;
      const baseSalaryMin = Math.round(baseSalaryMedian * 0.85);
      const baseSalaryMax = maxSalary || Math.round(baseSalaryMedian * 1.25);

      records.push({
        recordId: `H1B-${Date.now()}-${lineCount}`,
        jobTitle: jobTitle.slice(0, 200),
        socCode,
        industryNaics: getIndustry(socCode),
        companySize: "201-1000",
        companyType: "Private",
        state,
        msa: `${city}, ${state}`,
        costOfLivingIndex: colIndex,
        remoteEligibility: Math.random() > 0.6,
        baseSalaryMin,
        baseSalaryMedian,
        baseSalaryMax,
        totalCompMedian: Math.round(baseSalaryMedian * 1.15),
        currency: "USD",
        payType: "Salary",
        dataYear: 2024,
        minYearsExperience: getExperienceYears(wageLevel, jobTitle),
        educationLevel: getEducationLevel(socCode, jobTitle),
        skills: getSkills(socCode, jobTitle),
        managementLevel: getManagementLevel(wageLevel, jobTitle),
        dataSource: "H1B",
        confidenceScore: 0.92,
        sampleSize: 1,
        lastUpdated: new Date(),
      });

      lineCount++;
      
      if (lineCount % 10000 === 0) {
        console.log(`   Processed ${lineCount} H1B records...`);
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  console.log(`   ✅ Parsed ${records.length} H1B records`);
  return records;
}

// Better CSV parser that handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  
  return result;
}

async function importBLSData(filePath: string, limit: number = 20000): Promise<InsertCompensationRecord[]> {
  console.log("📊 Importing BLS data...");
  const records: InsertCompensationRecord[] = [];
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;
  let lineCount = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    if (lineCount >= limit) break;
    
    try {
      const values = parseCSVLine(line);
      
      // BLS column indices (after proper CSV parsing):
      // 0: location_code, 1: location_name, 2: location_type, 3: state
      // 4: industry_code, 5: employer_type, 6: occupation_code, 7: job_title
      // 8: occupation_level, 9: total_employment, ...
      // After the employment columns, we have salary data
      
      const locationType = values[2];
      const state = values[3];
      const socCode = values[6];
      const jobTitle = values[7];
      const occupationLevel = values[8];
      const totalEmployment = values[9];
      
      // Salary columns (based on debug output):
      // [22]: average_salary, [23]: salary_p10, [24]: salary_p25
      // [25]: typical_salary (median), [26]: salary_p75, [27]: salary_p90
      const meanWage = values[22];
      const salaryP10 = values[23];
      const salaryP25 = values[24];
      const typicalSalary = values[25];
      const salaryP75 = values[26];
      const salaryP90 = values[27];

      // Only include detailed occupation records with valid salary data
      if (occupationLevel !== "detailed") continue;
      if (!jobTitle || !socCode) continue;
      
      // Parse salaries (removing commas and non-numeric chars)
      const cleanNum = (s: string) => {
        if (!s || s === "#" || s === "*") return 0;
        return parseInt(s.replace(/[,$#*]/g, "")) || 0;
      };
      
      const median = cleanNum(typicalSalary);
      const p25 = cleanNum(salaryP25);
      const p75 = cleanNum(salaryP75);
      const employment = cleanNum(totalEmployment);
      
      if (median < 20000 || median > 500000) continue;

      const colIndex = STATE_COL[state] || 100;
      const locationName = locationType === "1" ? "U.S. National" : 
                          locationType === "2" ? state :
                          locationType === "4" ? "Metropolitan Area" : state;

      records.push({
        recordId: `BLS-${Date.now()}-${lineCount}`,
        jobTitle: jobTitle.slice(0, 200),
        socCode,
        industryNaics: getIndustry(socCode),
        companySize: "1000+",
        companyType: "Private",
        state: state || "US",
        msa: locationName,
        costOfLivingIndex: colIndex,
        remoteEligibility: socCode.startsWith("15-"),
        baseSalaryMin: p25 > 0 ? p25 : Math.round(median * 0.75),
        baseSalaryMedian: median,
        baseSalaryMax: p75 > 0 ? p75 : Math.round(median * 1.35),
        totalCompMedian: Math.round(median * 1.1),
        currency: "USD",
        payType: "Salary",
        dataYear: 2024,
        minYearsExperience: getExperienceYears("II", jobTitle),
        educationLevel: getEducationLevel(socCode, jobTitle),
        skills: getSkills(socCode, jobTitle),
        managementLevel: getManagementLevel("II", jobTitle),
        dataSource: "BLS",
        confidenceScore: 0.95,
        sampleSize: employment > 0 ? employment : 1000,
        lastUpdated: new Date(),
      });

      lineCount++;
      
      if (lineCount % 5000 === 0) {
        console.log(`   Processed ${lineCount} BLS records...`);
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  console.log(`   ✅ Parsed ${records.length} BLS records`);
  return records;
}

async function main() {
  console.log("🚀 Starting data import...\n");
  
  try {
    // Clear existing data
    console.log("🗑️  Clearing existing records...");
    await db.delete(compensationRecords);
    
    // Import from both sources
    const h1bRecords = await importH1BData(
      "attached_assets/LCA_Disclosure_Data_FY2025_Q3_1764401021565.csv",
      30000  // Import 30k H1B records
    );
    
    const blsRecords = await importBLSData(
      "attached_assets/all_data_M_2024V2_1764401021566.csv", 
      15000  // Import 15k BLS records
    );
    
    const allRecords = [...h1bRecords, ...blsRecords];
    console.log(`\n📦 Total records to insert: ${allRecords.length}`);
    
    // Insert in batches
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      await db.insert(compensationRecords).values(batch);
      inserted += batch.length;
      
      if (inserted % 5000 === 0) {
        console.log(`   Inserted ${inserted}/${allRecords.length} records...`);
      }
    }
    
    console.log(`\n✅ Successfully imported ${inserted} records!`);
    
    // Show summary
    const stats = await db.select({
      total: db.$count(compensationRecords),
    }).from(compensationRecords);
    
    console.log("\n📈 Database Summary:");
    console.log(`   Total Records: ${stats[0]?.total || 0}`);
    
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
