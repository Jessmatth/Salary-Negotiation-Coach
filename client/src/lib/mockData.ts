import { z } from "zod";

// Types
export interface SalaryRecord {
  id: string;
  jobTitle: string;
  socCode: string;
  industry: string;
  companySize: string;
  location: {
    state: string;
    msa: string;
    colIndex: number;
  };
  compensation: {
    min: number;
    max: number;
    median: number;
    p25: number;
    p75: number;
    currency: string;
  };
  experience: {
    minYears: number;
    level: "Entry" | "Mid" | "Senior" | "Lead" | "Manager" | "Director" | "Executive";
  };
  source: "BLS" | "H1B" | "Glassdoor" | "Levels.fyi";
  confidenceScore: number;
  lastUpdated: string;
}

// Mock Data Generator
const industries = ["Technology", "Finance", "Healthcare", "Manufacturing", "Retail", "Consulting"];
const states = ["CA", "NY", "TX", "WA", "MA", "IL"];
const levels = ["Entry", "Mid", "Senior", "Lead", "Manager", "Director", "Executive"] as const;
const sources = ["BLS", "H1B", "Glassdoor", "Levels.fyi"] as const;

const jobTitles = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
  "Financial Analyst",
  "HR Specialist",
  "Marketing Manager",
  "Sales Representative",
  "DevOps Engineer",
  "Solution Architect"
];

const generateMockData = (count: number): SalaryRecord[] => {
  return Array.from({ length: count }, (_, i) => {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const baseSalary = 60000 + Math.random() * 150000;
    
    // Adjust salary based on factors
    let multiplier = 1;
    if (industry === "Technology" || industry === "Finance") multiplier *= 1.2;
    if (state === "CA" || state === "NY") multiplier *= 1.3;
    if (level === "Senior") multiplier *= 1.4;
    if (level === "Director") multiplier *= 2.0;
    if (level === "Executive") multiplier *= 3.0;

    const median = Math.round(baseSalary * multiplier / 1000) * 1000;
    const min = Math.round(median * 0.85);
    const max = Math.round(median * 1.25);
    const p25 = Math.round(median * 0.9);
    const p75 = Math.round(median * 1.1);

    return {
      id: `rec-${i + 1}`,
      jobTitle: jobTitles[Math.floor(Math.random() * jobTitles.length)],
      socCode: `15-${1100 + Math.floor(Math.random() * 99)}`,
      industry,
      companySize: Math.random() > 0.5 ? "1000+" : "51-200",
      location: {
        state,
        msa: `MSA-${state}-${Math.floor(Math.random() * 10)}`,
        colIndex: 100 + (Math.random() * 40 - 10)
      },
      compensation: {
        min,
        max,
        median,
        p25,
        p75,
        currency: "USD"
      },
      experience: {
        minYears: Math.floor(Math.random() * 10),
        level
      },
      source: sources[Math.floor(Math.random() * sources.length)],
      confidenceScore: 0.7 + Math.random() * 0.29,
      lastUpdated: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0]
    };
  });
};

export const MOCK_DATA = generateMockData(200);

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
