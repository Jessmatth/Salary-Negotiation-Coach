import { z } from "zod";

// Enhanced Schema based on user requirements
export interface SalaryRecord {
  record_id: string;
  job_info: {
    title: string;
    soc_code: string;
    industry_naics: string; // Industry Sector for display
    company_size: "1-50" | "51-200" | "201-1000" | "1000+";
    company_type: "Public" | "Private" | "Nonprofit" | "Government";
  };
  location: {
    state: string;
    msa: string;
    cost_of_living_index: number;
    remote_eligibility: boolean;
  };
  compensation: {
    base_salary_min: number;
    base_salary_median: number;
    base_salary_max: number;
    total_comp_median: number;
    currency: "USD";
    pay_type: "Hourly" | "Salary";
    data_year: number;
  };
  requirements: {
    min_years_experience: number;
    education_level: "High School" | "Associate" | "Bachelor" | "Master" | "PhD";
    skills: string[];
    management_level: "IC" | "Manager" | "Director" | "VP" | "C-suite";
  };
  meta: {
    data_source: "BLS" | "H1B" | "Glassdoor" | "Levels.fyi" | "Payscale";
    confidence_score: number; // 0-1
    sample_size: number;
    last_updated: string;
  };
}

// Generators
const JOB_TITLES = [
  { title: "Software Engineer", soc: "15-1132" },
  { title: "Data Scientist", soc: "15-1111" },
  { title: "Product Manager", soc: "13-1199" },
  { title: "UX Designer", soc: "27-1024" },
  { title: "Financial Analyst", soc: "13-2051" },
  { title: "HR Specialist", soc: "13-1071" },
  { title: "Marketing Manager", soc: "11-2021" },
  { title: "Sales Representative", soc: "41-4012" },
  { title: "DevOps Engineer", soc: "15-1199" },
  { title: "Solution Architect", soc: "15-1133" }
];

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Manufacturing", "Retail", "Consulting", "Government"];
const STATES = ["CA", "NY", "TX", "WA", "MA", "IL", "CO", "VA"];
const MSAS = ["San Francisco-Oakland-Hayward", "New York-Newark-Jersey City", "Austin-Round Rock", "Seattle-Tacoma-Bellevue", "Boston-Cambridge-Newton", "Chicago-Naperville-Elgin"];
const SKILLS_POOL = ["Python", "SQL", "React", "Project Management", "Data Analysis", "AWS", "Communication", "Salesforce", "Financial Modeling", "Agile"];

const generateMockData = (count: number): SalaryRecord[] => {
  return Array.from({ length: count }, (_, i) => {
    const job = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
    const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
    const state = STATES[Math.floor(Math.random() * STATES.length)];
    const msa = MSAS[Math.floor(Math.random() * MSAS.length)];
    
    const baseSalary = 60000 + Math.random() * 180000;
    const experience = Math.floor(Math.random() * 15);
    
    // Adjust salary
    let multiplier = 1;
    if (industry === "Technology") multiplier += 0.2;
    if (state === "CA" || state === "NY") multiplier += 0.3;
    if (experience > 10) multiplier += 0.5;
    
    const median = Math.round(baseSalary * multiplier / 1000) * 1000;
    
    return {
      record_id: `REC-${2025000 + i}`,
      job_info: {
        title: job.title,
        soc_code: job.soc,
        industry_naics: industry,
        company_size: Math.random() > 0.7 ? "1000+" : Math.random() > 0.4 ? "201-1000" : "51-200",
        company_type: Math.random() > 0.3 ? "Private" : "Public",
      },
      location: {
        state,
        msa,
        cost_of_living_index: 90 + Math.random() * 60,
        remote_eligibility: Math.random() > 0.4
      },
      compensation: {
        base_salary_min: Math.round(median * 0.85),
        base_salary_median: median,
        base_salary_max: Math.round(median * 1.25),
        total_comp_median: Math.round(median * 1.15), // +15% for equity/bonus
        currency: "USD",
        pay_type: "Salary",
        data_year: 2024
      },
      requirements: {
        min_years_experience: experience,
        education_level: experience > 8 ? "Master" : "Bachelor",
        skills: Array.from({ length: 3 }, () => SKILLS_POOL[Math.floor(Math.random() * SKILLS_POOL.length)]),
        management_level: experience > 10 ? "Director" : experience > 5 ? "Manager" : "IC"
      },
      meta: {
        data_source: ["BLS", "H1B", "Glassdoor", "Levels.fyi"][Math.floor(Math.random() * 4)] as any,
        confidence_score: 0.65 + Math.random() * 0.34,
        sample_size: Math.floor(Math.random() * 5000) + 50,
        last_updated: new Date(Date.now() - Math.random() * 10000000000).toISOString()
      }
    };
  });
};

export const MOCK_DATA = generateMockData(500);

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
