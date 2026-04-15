import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ClientWithWorkflows,
  CreateClientInput,
  AddWorkflowInput,
  UpdateWorkflowInput,
  ClientWorkflowRecord,
} from "@/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function useClients() {
  return useQuery<ClientWithWorkflows[]>({
    queryKey: ["clients"],
    queryFn: () => fetchJSON<ClientWithWorkflows[]>("/api/clients"),
  });
}

export function useClient(id: string) {
  return useQuery<ClientWithWorkflows>({
    queryKey: ["clients", id],
    queryFn: () => fetchJSON<ClientWithWorkflows>(`/api/clients/${id}`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientInput) =>
      fetchJSON<ClientWithWorkflows>("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ClientWithWorkflows>) =>
      fetchJSON<ClientWithWorkflows>(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
}

export function useDeleteClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJSON<void>(`/api/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// --- Client Workflow hooks ---

export function useAddClientWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddWorkflowInput) =>
      fetchJSON<ClientWorkflowRecord>("/api/client-workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({
        queryKey: ["clients", variables.clientId],
      });
    },
  });
}

export function useUpdateClientWorkflow(cwId: string, clientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkflowInput) =>
      fetchJSON<ClientWorkflowRecord>(`/api/client-workflows/${cwId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      }
    },
  });
}

export function useDeleteClientWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cwId: string) =>
      fetchJSON<void>(`/api/client-workflows/${cwId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
