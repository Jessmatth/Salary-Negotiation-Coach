import { storage } from "./storage";
import type { InsertCompensationRecord } from "@shared/schema";

// Realistic salary data based on 2024 market data
const JOB_DATA = [
  { title: "Software Engineer", soc: "15-1252", baseMin: 75000, baseMax: 180000 },
  { title: "Senior Software Engineer", soc: "15-1252", baseMin: 120000, baseMax: 250000 },
  { title: "Staff Software Engineer", soc: "15-1252", baseMin: 160000, baseMax: 350000 },
  { title: "Data Scientist", soc: "15-2051", baseMin: 85000, baseMax: 200000 },
  { title: "Senior Data Scientist", soc: "15-2051", baseMin: 130000, baseMax: 260000 },
  { title: "Product Manager", soc: "11-2021", baseMin: 95000, baseMax: 210000 },
  { title: "Senior Product Manager", soc: "11-2021", baseMin: 140000, baseMax: 280000 },
  { title: "UX Designer", soc: "27-1024", baseMin: 70000, baseMax: 150000 },
  { title: "Senior UX Designer", soc: "27-1024", baseMin: 110000, baseMax: 190000 },
  { title: "DevOps Engineer", soc: "15-1299", baseMin: 85000, baseMax: 175000 },
  { title: "Solutions Architect", soc: "15-1199", baseMin: 125000, baseMax: 240000 },
  { title: "Engineering Manager", soc: "11-9041", baseMin: 140000, baseMax: 280000 },
  { title: "Director of Engineering", soc: "11-9041", baseMin: 180000, baseMax: 380000 },
  { title: "Financial Analyst", soc: "13-2051", baseMin: 65000, baseMax: 140000 },
  { title: "Senior Financial Analyst", soc: "13-2051", baseMin: 95000, baseMax: 175000 },
  { title: "Marketing Manager", soc: "11-2021", baseMin: 80000, baseMax: 165000 },
  { title: "Sales Engineer", soc: "41-4011", baseMin: 75000, baseMax: 160000 },
  { title: "HR Business Partner", soc: "13-1071", baseMin: 75000, baseMax: 145000 },
  { title: "Security Engineer", soc: "15-1212", baseMin: 95000, baseMax: 195000 },
  { title: "Machine Learning Engineer", soc: "15-2051", baseMin: 120000, baseMax: 260000 },
];

const INDUSTRIES = [
  "Technology",
  "Finance", 
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Government"
];

const LOCATIONS = [
  { state: "CA", msa: "San Francisco-Oakland-Hayward, CA", colMultiplier: 1.45 },
  { state: "CA", msa: "San Jose-Sunnyvale-Santa Clara, CA", colMultiplier: 1.48 },
  { state: "CA", msa: "Los Angeles-Long Beach-Anaheim, CA", colMultiplier: 1.32 },
  { state: "NY", msa: "New York-Newark-Jersey City, NY-NJ-PA", colMultiplier: 1.38 },
  { state: "WA", msa: "Seattle-Tacoma-Bellevue, WA", colMultiplier: 1.28 },
  { state: "MA", msa: "Boston-Cambridge-Newton, MA-NH", colMultiplier: 1.25 },
  { state: "TX", msa: "Austin-Round Rock, TX", colMultiplier: 1.12 },
  { state: "TX", msa: "Dallas-Fort Worth-Arlington, TX", colMultiplier: 1.08 },
  { state: "IL", msa: "Chicago-Naperville-Elgin, IL-IN-WI", colMultiplier: 1.15 },
  { state: "CO", msa: "Denver-Aurora-Lakewood, CO", colMultiplier: 1.18 },
  { state: "VA", msa: "Washington-Arlington-Alexandria, DC-VA-MD-WV", colMultiplier: 1.22 },
  { state: "GA", msa: "Atlanta-Sandy Springs-Roswell, GA", colMultiplier: 1.05 },
];

const COMPANY_SIZES = ["1-50", "51-200", "201-1000", "1000+"] as const;
const COMPANY_TYPES = ["Public", "Private", "Nonprofit", "Government"] as const;
const EDUCATION_LEVELS = ["Bachelor", "Master", "PhD"] as const;
const DATA_SOURCES = ["BLS", "H1B", "Glassdoor", "Levels.fyi", "Payscale"] as const;

const SKILLS_BY_ROLE: Record<string, string[]> = {
  "Software Engineer": ["JavaScript", "Python", "React", "Node.js", "SQL", "Git", "AWS"],
  "Data Scientist": ["Python", "SQL", "Machine Learning", "Statistics", "R", "TensorFlow", "pandas"],
  "Product Manager": ["Product Strategy", "Agile", "Roadmapping", "SQL", "Data Analysis", "A/B Testing"],
  "UX Designer": ["Figma", "User Research", "Prototyping", "Design Systems", "Accessibility", "HTML/CSS"],
  "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Python", "Linux"],
  "Solutions Architect": ["AWS", "System Design", "Microservices", "Cloud Architecture", "Security"],
  "Engineering Manager": ["Leadership", "Agile", "Hiring", "Mentoring", "System Design", "Strategy"],
  "Financial Analyst": ["Excel", "Financial Modeling", "SQL", "Tableau", "Forecasting", "Budgeting"],
  "Marketing Manager": ["Digital Marketing", "Analytics", "SEO/SEM", "Content Strategy", "Social Media"],
  "Security Engineer": ["Cybersecurity", "Penetration Testing", "SIEM", "Compliance", "Network Security"],
  "Machine Learning Engineer": ["Python", "TensorFlow", "PyTorch", "MLOps", "Computer Vision", "NLP"],
};

function getSkillsForRole(role: string): string[] {
  const baseRole = role.replace(/^(Senior|Staff|Lead|Principal)\s+/, "");
  return SKILLS_BY_ROLE[baseRole] || ["Communication", "Problem Solving", "Collaboration"];
}

function getManagementLevel(role: string): "IC" | "Manager" | "Director" | "VP" | "C-suite" {
  if (role.includes("Director")) return "Director";
  if (role.includes("VP") || role.includes("Vice President")) return "VP";
  if (role.includes("CTO") || role.includes("CEO") || role.includes("CFO")) return "C-suite";
  if (role.includes("Manager") || role.includes("Lead")) return "Manager";
  return "IC";
}

function getExperienceYears(role: string): number {
  if (role.includes("Staff") || role.includes("Principal")) return 8 + Math.floor(Math.random() * 5);
  if (role.includes("Senior")) return 5 + Math.floor(Math.random() * 4);
  if (role.includes("Director")) return 10 + Math.floor(Math.random() * 5);
  if (role.includes("Manager")) return 6 + Math.floor(Math.random() * 5);
  return Math.floor(Math.random() * 5);
}

function generateRecord(job: typeof JOB_DATA[0], industry: string, location: typeof LOCATIONS[0]): InsertCompensationRecord {
  const recordId = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Adjust salary based on location
  const baseSalaryMedian = Math.round((job.baseMin + job.baseMax) / 2 * location.colMultiplier);
  const baseSalaryMin = Math.round(baseSalaryMedian * 0.85);
  const baseSalaryMax = Math.round(baseSalaryMedian * 1.25);
  
  // Total comp includes equity/bonus (10-25% more)
  const totalCompMedian = Math.round(baseSalaryMedian * (1.1 + Math.random() * 0.15));
  
  const companySize = COMPANY_SIZES[Math.floor(Math.random() * COMPANY_SIZES.length)];
  const companyType = COMPANY_TYPES[Math.floor(Math.random() * COMPANY_TYPES.length)];
  const educationLevel = EDUCATION_LEVELS[Math.floor(Math.random() * EDUCATION_LEVELS.length)];
  const dataSource = DATA_SOURCES[Math.floor(Math.random() * DATA_SOURCES.length)];
  
  // Confidence score based on source and sample size
  const sourceConfidence = dataSource === "BLS" || dataSource === "H1B" ? 0.85 : 0.70;
  const sampleSize = Math.floor(Math.random() * 4000) + 100;
  const sampleConfidence = Math.min(0.15, Math.log10(sampleSize) / 20);
  const confidenceScore = Math.min(0.99, sourceConfidence + sampleConfidence + Math.random() * 0.05);
  
  return {
    recordId,
    jobTitle: job.title,
    socCode: job.soc,
    industryNaics: industry,
    companySize,
    companyType,
    state: location.state,
    msa: location.msa,
    costOfLivingIndex: Math.round(location.colMultiplier * 100),
    remoteEligibility: Math.random() > 0.4,
    baseSalaryMin,
    baseSalaryMedian,
    baseSalaryMax,
    totalCompMedian,
    currency: "USD",
    payType: "Salary",
    dataYear: 2024,
    minYearsExperience: getExperienceYears(job.title),
    educationLevel,
    skills: getSkillsForRole(job.title).slice(0, 3 + Math.floor(Math.random() * 3)),
    managementLevel: getManagementLevel(job.title),
    dataSource,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    sampleSize,
    lastUpdated: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
  };
}

export async function seedDatabase() {
  console.log("🌱 Starting database seed...");
  
  try {
    const records: InsertCompensationRecord[] = [];
    
    // Generate multiple records for each combination
    for (const job of JOB_DATA) {
      for (const industry of INDUSTRIES) {
        // Each job gets 2-3 location variations
        const selectedLocations = LOCATIONS.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
        
        for (const location of selectedLocations) {
          records.push(generateRecord(job, industry, location));
        }
      }
    }
    
    console.log(`📊 Generated ${records.length} compensation records`);
    console.log("💾 Inserting into database...");
    
    await storage.bulkCreateCompensationRecords(records);
    
    console.log("✅ Database seeded successfully!");
    
    const stats = await storage.getAggregateStats();
    console.log("\n📈 Database Stats:");
    console.log(`   - Total Records: ${stats.totalRecords}`);
    console.log(`   - Average Salary: $${stats.avgSalary.toLocaleString()}`);
    console.log(`   - Unique Roles: ${stats.uniqueRoles}`);
    console.log(`   - Industries: ${stats.uniqueIndustries}`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
