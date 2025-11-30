import { useQuery, useMutation } from "@tanstack/react-query";
import type { 
  QueryCompensation, 
  ScorecardInput, 
  ScorecardResult,
  LeverageQuizInput,
  LeverageResult,
  ScriptInput,
  ScriptResult,
  FeedbackInput,
} from "@shared/schema";

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "An error occurred");
  }

  return response.json();
}

// Scorecard API
export function useScorecard() {
  return useMutation({
    mutationFn: (data: ScorecardInput) =>
      fetcher<ScorecardResult>("/api/scorecard", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// Leverage Score API
export function useLeverageScore() {
  return useMutation({
    mutationFn: (data: LeverageQuizInput & { currentOffer?: number; sessionId?: string }) =>
      fetcher<LeverageResult>("/api/leverage-score", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// Script Generator API
export function useScriptGenerator() {
  return useMutation({
    mutationFn: (data: ScriptInput) =>
      fetcher<ScriptResult>("/api/scripts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// Job Title Suggestions API
export function useJobTitleSuggestions(query: string) {
  return useQuery({
    queryKey: ["job-titles", query],
    queryFn: () => fetcher<string[]>(`/api/job-titles?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    staleTime: 30000,
  });
}

// User Feedback API
export function useFeedback() {
  return useMutation({
    mutationFn: (data: FeedbackInput) =>
      fetcher<{ success: boolean }>("/api/feedback", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// Aggregate Stats (for home page)
export function useAggregateStats() {
  return useQuery({
    queryKey: ["analytics", "stats"],
    queryFn: () =>
      fetcher<{
        totalRecords: number;
        avgSalary: number;
        uniqueRoles: number;
        uniqueIndustries: number;
      }>("/api/analytics/stats"),
  });
}

// Legacy endpoints kept for compatibility
export function useCompensationRecords(query: Partial<QueryCompensation> = {}) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.industry) params.set("industry", query.industry);
  if (query.state) params.set("state", query.state);
  if (query.managementLevel) params.set("managementLevel", query.managementLevel);
  if (query.minSalary) params.set("minSalary", query.minSalary.toString());
  if (query.maxSalary) params.set("maxSalary", query.maxSalary.toString());
  if (query.limit) params.set("limit", query.limit.toString());
  if (query.offset) params.set("offset", query.offset.toString());

  return useQuery({
    queryKey: ["compensation", query],
    queryFn: () =>
      fetcher<{ records: any[]; total: number }>(`/api/compensation?${params.toString()}`),
  });
}

export function useSalaryByRole() {
  return useQuery({
    queryKey: ["analytics", "salary-by-role"],
    queryFn: () =>
      fetcher<Array<{ name: string; salary: number }>>("/api/analytics/salary-by-role"),
  });
}

export function useIndustryDistribution() {
  return useQuery({
    queryKey: ["analytics", "industry-distribution"],
    queryFn: () =>
      fetcher<Array<{ name: string; value: number }>>("/api/analytics/industry-distribution"),
  });
}

export function useRecentRecords(limit: number = 5) {
  return useQuery({
    queryKey: ["analytics", "recent", limit],
    queryFn: () => fetcher<any[]>(`/api/analytics/recent?limit=${limit}`),
  });
}
