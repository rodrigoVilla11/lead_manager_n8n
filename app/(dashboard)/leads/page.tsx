"use client";

import { useState } from "react";
import { Mail, Phone, Globe, Users } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/stats-card";
import { LiveExecutions } from "@/components/workflows/live-executions";
import { useClients } from "@/hooks/use-clients";
import { useGlobalLeadsStats } from "@/hooks/use-leads";

export default function LeadsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    undefined
  );

  const { data: clients } = useClients();
  const {
    data: leadsStats,
    isLoading,
    error,
  } = useGlobalLeadsStats(selectedClientId);

  const chartData =
    leadsStats?.byDate.map((d) => ({ date: d.date, leads: d.count })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Leads</h2>

        <Select
          value={selectedClientId ?? "all"}
          onValueChange={(val) =>
            setSelectedClientId(val === "all" ? undefined : val ?? undefined)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex h-48 items-center justify-center rounded-xl border bg-white text-sm text-red-500 dark:bg-card">
          Error al cargar datos de leads.
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Leads Totales"
              value={leadsStats?.totalLeads ?? 0}
              icon={<Users className="h-4 w-4" />}
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
            <StatsCard
              title="Con Website"
              value={leadsStats?.totalWithWebsite ?? 0}
              icon={<Globe className="h-4 w-4" />}
            />
          </div>

          {/* Chart + per-client breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Leads by date chart */}
            <Card className="rounded-xl bg-white dark:bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Leads por dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="leadsPageGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#7C3AED"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="#7C3AED"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          className="text-muted-foreground"
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "var(--color-popover, #fff)",
                            border: "1px solid var(--color-border, #e5e7eb)",
                            borderRadius: "8px",
                            fontSize: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          labelStyle={{ fontWeight: 600 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="leads"
                          stroke="#7C3AED"
                          strokeWidth={2}
                          fill="url(#leadsPageGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    No hay datos con fecha disponibles.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Per-client breakdown */}
            {leadsStats && leadsStats.perClient.length > 0 && (
              <Card className="rounded-xl bg-white dark:bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Leads por Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leadsStats.perClient
                    .sort((a, b) => b.total - a.total)
                    .map((c) => (
                      <div key={c.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{c.name}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {c.withEmail} emails
                            </Badge>
                            <span className="text-muted-foreground">
                              {c.total} leads
                            </span>
                          </div>
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

          {/* Top values */}
          {leadsStats && Object.keys(leadsStats.topValues).length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(leadsStats.topValues).map(([col, values]) => (
                <Card key={col} className="rounded-xl bg-white dark:bg-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      Top {col}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {values.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="truncate text-muted-foreground">
                            {v.value}
                          </span>
                          <Badge variant="secondary">{v.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Live executions */}
          <LiveExecutions />
        </>
      )}
    </div>
  );
}
