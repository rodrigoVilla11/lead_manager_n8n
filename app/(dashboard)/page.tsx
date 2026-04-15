"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  GitBranch,
  TrendingUp,
  DollarSign,
  Phone,
  Globe,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/stats-card";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { ClientsTable } from "@/components/dashboard/clients-table";
import { BillingSummary } from "@/components/dashboard/billing-summary";
import { useClients } from "@/hooks/use-clients";
import { useGlobalLeadsStats } from "@/hooks/use-leads";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";

export default function DashboardPage() {
  const { permissions, role } = useUser();
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: leadsStats, isLoading: leadsLoading } = useGlobalLeadsStats(
    selectedClientId !== "all" ? selectedClientId : undefined
  );

  const isLoading = clientsLoading || leadsLoading;

  const filteredClients =
    selectedClientId === "all"
      ? clients
      : clients?.filter((c) => c.id === selectedClientId);

  const activeClients =
    filteredClients?.filter((c) => c.status === "ACTIVE").length ?? 0;
  const activeWorkflows =
    filteredClients?.reduce(
      (sum, c) => sum + c.workflows.filter((w) => w.active).length,
      0
    ) ?? 0;
  const monthlyRevenue =
    filteredClients?.reduce((sum, c) => sum + (c.monthlyAmount ?? 0), 0) ?? 0;

  // Chart data from sheet stats
  const chartData =
    leadsStats?.byDate.map((d) => ({ date: d.date, leads: d.count })) ?? [];

  // Client role: show dedicated dashboard for their assigned client
  if (role === "client" && !isLoading && clients && clients.length > 0) {
    return <ClientDashboard client={clients[0]} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Client Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        {permissions.canSeeAllClients && (clients?.length ?? 0) > 1 && (
          <Select
            value={selectedClientId}
            onValueChange={(val) => val && setSelectedClientId(val)}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos los clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats Row 1 - Leads from Sheets */}
      <div
        className={`grid gap-4 sm:grid-cols-2 ${role === "client" ? "lg:grid-cols-3" : "lg:grid-cols-5"}`}
      >
        {role !== "client" && (
          <StatsCard
            title="Clientes Activos"
            value={activeClients}
            icon={<Users className="h-4 w-4" />}
          />
        )}
        <StatsCard
          title="Leads Totales"
          value={leadsStats?.totalLeads ?? 0}
          icon={<Mail className="h-4 w-4" />}
        />
        <StatsCard
          title="Con Email"
          value={leadsStats?.totalWithEmail ?? 0}
          icon={<Mail className="h-4 w-4" />}
        />
        <StatsCard
          title="Con Telefono"
          value={leadsStats?.totalWithPhone ?? 0}
          icon={<Phone className="h-4 w-4" />}
        />
        {role !== "client" && (
          <StatsCard
            title="Con Website"
            value={leadsStats?.totalWithWebsite ?? 0}
            icon={<Globe className="h-4 w-4" />}
          />
        )}
      </div>

      {/* Stats Row 2 - Operations */}
      {permissions.canSeeAutomation && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Workflows Activos"
            value={activeWorkflows}
            icon={<GitBranch className="h-4 w-4" />}
          />
          {permissions.canManageBilling && (
            <StatsCard
              title="Ingreso Mensual"
              value={`$${monthlyRevenue.toLocaleString()}`}
              icon={<DollarSign className="h-4 w-4" />}
            />
          )}
          {leadsStats && leadsStats.clientsWithSheet > 0 && (
            <StatsCard
              title="Clientes con Sheet"
              value={leadsStats.clientsWithSheet}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeadsChart data={chartData} />

        {/* Leads per client breakdown */}
        {leadsStats &&
          leadsStats.perClient.length > 0 &&
          role !== "client" && (
            <Card className="rounded-xl bg-white dark:bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Leads por Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leadsStats.perClient
                  .sort((a, b) => b.total - a.total)
                  .map((c) => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{c.name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {c.total} leads
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[#7C3AED]"
                          style={{
                            width: `${Math.max(
                              (c.total /
                                Math.max(
                                  ...leadsStats.perClient.map((x) => x.total)
                                )) *
                                100,
                              2
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
      </div>

      {/* Billing summary */}
      {permissions.canManageBilling && (
        <BillingSummary clients={clients ?? []} />
      )}

      {/* Clients table */}
      {role !== "client" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Clientes</h3>
          <ClientsTable clients={filteredClients ?? []} />
        </div>
      )}
    </div>
  );
}
