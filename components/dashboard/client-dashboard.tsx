"use client";

import { useEffect, useState } from "react";
import type { ClientWithWorkflows, PaymentRecord } from "@/types";
import { LeadsTable } from "@/components/clients/leads-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  Calendar,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface LeadsStats {
  total: number;
  withEmail: number;
  withPhone: number;
  withWebsite: number;
  byDate: { date: string; count: number }[];
  fillRate: Record<string, number>;
  topValues: Record<string, { value: string; count: number }[]>;
}

interface ClientDashboardProps {
  client: ClientWithWorkflows;
}

export function ClientDashboard({ client }: ClientDashboardProps) {
  const [leadsStats, setLeadsStats] = useState<LeadsStats | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch leads stats
      if (client.googleSheetUrl) {
        try {
          const res = await fetch(`/api/clients/${client.id}/leads-stats`);
          if (res.ok) setLeadsStats(await res.json());
        } catch {}
      }

      // Fetch payments
      try {
        const res = await fetch(`/api/clients/${client.id}`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments ?? []);
        }
      } catch {}

      setLoading(false);
    }
    load();
  }, [client.id, client.googleSheetUrl]);

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-screen max-w-5xl">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Hola, {client.name}
        </h2>
        <p className="text-muted-foreground">
          Resumen de tu cuenta y metricas
        </p>
      </div>

      {/* Lead stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              Leads Totales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {leadsStats?.total ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Mail className="size-3.5" />
              Con Email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {leadsStats?.withEmail ?? 0}
            </p>
            {leadsStats && leadsStats.total > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${(leadsStats.withEmail / leadsStats.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              Con Telefono
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {leadsStats?.withPhone ?? 0}
            </p>
            {leadsStats && leadsStats.total > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${(leadsStats.withPhone / leadsStats.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FileText className="size-3.5" />
              Con Website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {leadsStats?.withWebsite ?? 0}
            </p>
            {leadsStats && leadsStats.total > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{
                    width: `${(leadsStats.withWebsite / leadsStats.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads by date chart */}
        <Card style={{ borderRadius: 12 }}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Leads por Fecha
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsStats && leadsStats.byDate.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={leadsStats.byDate.slice(-30)}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="clientDashGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--color-popover, #fff)",
                        border: "1px solid var(--color-border, #e5e7eb)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} fill="url(#clientDashGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No hay datos de fecha disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contactability */}
        {leadsStats && leadsStats.total > 0 && (
          <Card style={{ borderRadius: 12 }}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Contactabilidad
              </CardTitle>
              <CardDescription>
                Datos de contacto encontrados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Email", value: leadsStats.withEmail, color: "bg-emerald-500", icon: Mail },
                { label: "Telefono", value: leadsStats.withPhone, color: "bg-blue-500", icon: Phone },
                { label: "Website", value: leadsStats.withWebsite, color: "bg-violet-500", icon: FileText },
              ].map((item) => {
                const pct = Math.round((item.value / leadsStats.total) * 100);
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium">
                        <item.icon className="size-3.5 text-muted-foreground" />
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">
                        {item.value} de {leadsStats.total} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Data quality + top values */}
      <div className="grid gap-6 lg:grid-cols-2">
        {leadsStats && Object.keys(leadsStats.fillRate).length > 0 && (
          <Card style={{ borderRadius: 12 }}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Calidad de Datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {Object.entries(leadsStats.fillRate)
                  .sort(([, a], [, b]) => b - a)
                  .map(([col, pct]) => (
                    <div key={col} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">{col}</span>
                        <span className={`font-medium ${pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {leadsStats && Object.keys(leadsStats.topValues).length > 0 && (
          <div className="space-y-4">
            {Object.entries(leadsStats.topValues).map(([col, values]) => (
              <Card key={col} style={{ borderRadius: 12 }}>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Top {col}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {values.map((v, i) => {
                      const maxCount = values[0].count;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 shrink-0 text-xs text-muted-foreground text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="truncate text-sm">{v.value}</span>
                              <Badge variant="secondary" className="ml-2 shrink-0">{v.count}</Badge>
                            </div>
                            <div className="h-1 rounded-full bg-muted">
                              <div className="h-full rounded-full bg-[#7C3AED]/60" style={{ width: `${(v.count / maxCount) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Billing info */}
      {(client.monthlyAmount || client.nextPaymentDate || payments.length > 0) && (
        <Card style={{ borderRadius: 12 }}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tu Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Plan Mensual</p>
                <p className="text-2xl font-bold">
                  {client.monthlyAmount ? `$${client.monthlyAmount.toLocaleString()}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Proximo Pago</p>
                {client.nextPaymentDate ? (
                  <>
                    <p className="text-lg font-semibold">
                      {format(new Date(client.nextPaymentDate), "dd/MM/yyyy")}
                    </p>
                    {(() => {
                      const days = differenceInDays(new Date(client.nextPaymentDate), new Date());
                      return (
                        <Badge variant={days < 0 ? "destructive" : days <= 7 ? "outline" : "default"} className="mt-1">
                          {days < 0 ? `Vencido hace ${Math.abs(days)} dias` : days === 0 ? "Vence hoy" : `En ${days} dias`}
                        </Badge>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-lg font-semibold text-muted-foreground">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pagado</p>
                <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {payments.filter((p) => p.status === "PAID").length} pagos
                </p>
              </div>
            </div>

            {/* Cost per lead */}
            {leadsStats && leadsStats.total > 0 && client.monthlyAmount && (
              <div className="border-t mt-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Costo por Lead</span>
                  <span className="text-xl font-bold text-[#7C3AED]">
                    ${(client.monthlyAmount / leadsStats.total).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leads table (read only) */}
      {client.googleSheetUrl && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Tus Leads</h3>
          <LeadsTable
            clientId={client.id}
            clientName={client.name}
            googleSheetUrl={client.googleSheetUrl}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
