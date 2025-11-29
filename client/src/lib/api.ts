import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryCompensation, BenchmarkRequest } from "@shared/schema";

// API Client
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

// Hooks
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
      fetcher<{ records: any[], total: number }>(`/api/compensation?${params.toString()}`),
  });
}

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

export function useBenchmarkCalculation() {
  return useMutation({
    mutationFn: (data: BenchmarkRequest) =>
      fetcher<{
        min: number;
        max: number;
        median: number;
        p25: number;
        p75: number;
        factors: {
          industry: number;
          location: number;
          experience: number;
        };
      }>("/api/benchmark", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
