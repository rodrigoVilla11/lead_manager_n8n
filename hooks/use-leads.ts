import { useQuery } from "@tanstack/react-query";
import type { LeadsByDay } from "@/types";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function useLeadStats(clientId?: string, days?: number) {
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  if (days) params.set("days", String(days));
  const qs = params.toString();

  return useQuery<LeadsByDay[]>({
    queryKey: ["leads", "stats", clientId, days],
    queryFn: () =>
      fetchJSON<LeadsByDay[]>(`/api/leads${qs ? `?${qs}` : ""}`),
  });
}

export interface GlobalLeadsStats {
  totalLeads: number;
  totalWithEmail: number;
  totalWithPhone: number;
  totalWithWebsite: number;
  byDate: { date: string; count: number }[];
  topValues: Record<string, { value: string; count: number }[]>;
  perClient: {
    id: string;
    name: string;
    total: number;
    withEmail: number;
    withPhone: number;
  }[];
  clientsWithSheet: number;
}

export function useGlobalLeadsStats(clientId?: string) {
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  const qs = params.toString();

  return useQuery<GlobalLeadsStats>({
    queryKey: ["leads-stats", "global", clientId],
    queryFn: () =>
      fetchJSON<GlobalLeadsStats>(`/api/leads-stats${qs ? `?${qs}` : ""}`),
    staleTime: 60_000,
  });
}
