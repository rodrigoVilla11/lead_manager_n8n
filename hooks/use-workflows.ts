import { useState, useEffect, useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { N8nWorkflow } from "@/types";

const HIDDEN_WORKFLOWS_KEY = "hidden-workflows";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function useWorkflows() {
  return useQuery<N8nWorkflow[]>({
    queryKey: ["workflows"],
    queryFn: () => fetchJSON<N8nWorkflow[]>("/api/workflows"),
  });
}

export function useActivateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<unknown>(`/api/workflows/${id}/activate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeactivateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<unknown>(`/api/workflows/${id}/deactivate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useSyncWorkflows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJSON<unknown>("/api/workflows/sync", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<unknown>(`/api/workflows/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useHiddenWorkflows() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(HIDDEN_WORKFLOWS_KEY);
    if (stored) {
      setHiddenIds(new Set(JSON.parse(stored)));
    }
  }, []);

  const persist = useCallback((ids: Set<string>) => {
    localStorage.setItem(HIDDEN_WORKFLOWS_KEY, JSON.stringify([...ids]));
    setHiddenIds(ids);
  }, []);

  const hide = useCallback(
    (id: string) => {
      const next = new Set(hiddenIds);
      next.add(id);
      persist(next);
    },
    [hiddenIds, persist]
  );

  const restore = useCallback(
    (id: string) => {
      const next = new Set(hiddenIds);
      next.delete(id);
      persist(next);
    },
    [hiddenIds, persist]
  );

  const restoreAll = useCallback(() => {
    persist(new Set());
  }, [persist]);

  return { hiddenIds, hide, restore, restoreAll };
}
