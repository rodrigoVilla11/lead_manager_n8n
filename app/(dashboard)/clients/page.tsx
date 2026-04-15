"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useClients } from "@/hooks/use-clients";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClientCard } from "@/components/clients/client-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Download } from "lucide-react";
import { downloadCSV } from "@/lib/export-csv";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Activos" },
  { value: "PAUSED", label: "Pausados" },
  { value: "CANCELLED", label: "Cancelados" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const queryClient = useQueryClient();

  async function handleDeleteClient(id: string) {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Cliente eliminado");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch {
      toast.error("Error al eliminar cliente");
    }
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => {
      const matchesSearch = c.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tus clientes y sus workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!clients?.length) return;
              downloadCSV(
                "clientes",
                ["Nombre", "Email", "Telefono", "Estado", "Leads Totales", "Leads Mes", "Workflows"],
                clients.map((c) => [
                  c.name,
                  c.email ?? "",
                  c.phone ?? "",
                  c.status,
                  String(c.totalLeads),
                  String(c.leadsThisMonth),
                  String(c.workflows.length),
                ])
              );
              toast.success("CSV exportado");
            }}
            disabled={!clients?.length}
          >
            <Download className="size-4" />
            Exportar
          </Button>
          <Button render={<Link href="/clients/new" />}>
            <Plus className="size-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((sf) => (
            <Button
              key={sf.value}
              variant={statusFilter === sf.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(sf.value)}
            >
              {sf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16">
          <div className="rounded-full bg-muted p-4">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">No hay clientes</h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "No se encontraron clientes con los filtros aplicados"
                : "Comienza creando tu primer cliente"}
            </p>
          </div>
          {!search && statusFilter === "ALL" && (
            <Button render={<Link href="/clients/new" />}>
              <Plus className="size-4" />
              Nuevo Cliente
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!isLoading && filteredClients.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onDelete={handleDeleteClient}
            />
          ))}
        </div>
      )}
    </div>
  );
}
