"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useClient,
  useDeleteClient,
  useAddClientWorkflow,
  useDeleteClientWorkflow,
} from "@/hooks/use-clients";
import {
  useActivateWorkflow,
  useDeactivateWorkflow,
} from "@/hooks/use-workflows";
import { WorkflowList } from "@/components/clients/workflow-list";
import { LiveExecutions } from "@/components/workflows/live-executions";
import { AddWorkflowDialog } from "@/components/clients/add-workflow-dialog";
import { BillingTab } from "@/components/clients/billing-tab";
import { LeadsTable } from "@/components/clients/leads-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Trash2,
  Users,
  TrendingUp,
  Activity,
  Clock,
  Mail,
  Phone,
  FileText,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
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
import { useQueryClient } from "@tanstack/react-query";
import type { PaymentRecord } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  ACTIVE: { label: "Activo", variant: "default" },
  PAUSED: { label: "Pausado", variant: "secondary" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

const EXEC_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  SUCCESS: { label: "Exitoso", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
  RUNNING: { label: "Ejecutando", variant: "secondary" },
  WAITING: { label: "Esperando", variant: "outline" },
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: client, isLoading } = useClient(id);
  const deleteClient = useDeleteClient(id);
  const addWorkflow = useAddClientWorkflow();
  const deleteWorkflow = useDeleteClientWorkflow();
  const activateWorkflow = useActivateWorkflow();
  const deactivateWorkflow = useDeactivateWorkflow();

  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Real stats from Google Sheets and n8n
  interface LeadsStats {
    total: number;
    withEmail: number;
    withPhone: number;
    withWebsite: number;
    byDate: { date: string; count: number }[];
    fillRate: Record<string, number>;
    topValues: Record<string, { value: string; count: number }[]>;
  }

  const [leadsStats, setLeadsStats] = useState<LeadsStats | null>(null);
  const [execStats, setExecStats] = useState<{
    total: number;
    success: number;
    error: number;
    lastDate: string | null;
  } | null>(null);

  useEffect(() => {
    if (!client) return;

    // Fetch leads stats from Google Sheets
    if (client.googleSheetUrl) {
      fetch(`/api/clients/${id}/leads-stats`)
        .then((r) => r.json())
        .then((d) => setLeadsStats(d))
        .catch(() => {});
    }

    // Fetch execution stats from n8n
    const wfIds = client.workflows
      .map((w) => w.n8nWorkflowId)
      .filter((wfId): wfId is string => wfId !== null);

    if (wfIds.length > 0) {
      Promise.all(
        wfIds.map((wfId) =>
          fetch(`/api/executions?workflowId=${wfId}&limit=50`)
            .then((r) => r.json())
            .catch(() => []),
        ),
      ).then((results) => {
        const all = results.flat();
        setExecStats({
          total: all.length,
          success: all.filter((e: { status: string }) => e.status === "success")
            .length,
          error: all.filter((e: { status: string }) => e.status === "error")
            .length,
          lastDate: all.length > 0 ? all[0].startedAt : null,
        });
      });
    }
  }, [client, id]);

  function handleDelete() {
    if (!confirm("Estas seguro que deseas eliminar este cliente?")) return;
    deleteClient.mutate(undefined, {
      onSuccess: () => {
        toast.success("Cliente eliminado");
        router.push("/clients");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Error al eliminar");
      },
    });
  }

  function handleToggleWorkflow(
    cwId: string,
    n8nWorkflowId: string,
    active: boolean,
  ) {
    const mutation = active ? activateWorkflow : deactivateWorkflow;
    mutation.mutate(n8nWorkflowId, {
      onSuccess: () =>
        toast.success(
          `Workflow ${active ? "activado" : "desactivado"} exitosamente`,
        ),
      onError: () => toast.error("Error al cambiar estado del workflow"),
    });
  }

  function handleDeleteWorkflow(cwId: string) {
    deleteWorkflow.mutate(cwId, {
      onSuccess: () => toast.success("Workflow eliminado"),
      onError: () => toast.error("Error al eliminar workflow"),
    });
  }

  async function handleSaveNotes(cwId: string, notes: string) {
    try {
      const res = await fetch(`/api/client-workflows/${cwId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Notas guardadas");
    } catch {
      toast.error("Error al guardar notas");
    }
  }

  function handleAssignWorkflow(n8nWorkflowId: string, displayName: string) {
    addWorkflow.mutate(
      { clientId: id, displayName, n8nWorkflowId },
      {
        onSuccess: () => {
          toast.success("Workflow asignado");
          setShowAddDialog(false);
        },
        onError: () => toast.error("Error al asignar workflow"),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <h2 className="text-lg font-semibold">Cliente no encontrado</h2>
        <Button variant="outline" render={<Link href="/clients" />}>
          <ArrowLeft className="size-4" />
          Volver a Clientes
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.ACTIVE;
  const activeWfCount = client.workflows.filter((w) => w.active).length;
  const totalWfCount = client.workflows.length;

  // n8n workflow IDs for this client
  const n8nWorkflowIds = client.workflows
    .map((wf) => wf.n8nWorkflowId)
    .filter((id): id is string => id !== null);

  return (
    <div className="min-w-0 space-y-6 w-screen max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/clients" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {client.name}
              </h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Creado el {format(new Date(client.createdAt), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteClient.isPending}
          >
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="workflows">
            Workflows ({totalWfCount})
          </TabsTrigger>
          <TabsTrigger value="ejecuciones">Ejecuciones</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="facturacion">Facturacion</TabsTrigger>
        </TabsList>

        {/* Resumen Tab */}
        <TabsContent value="resumen">
          <div className="space-y-6 pt-4">
            {/* Row 1: Lead metrics */}
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
                    {leadsStats?.total ?? "—"}
                  </p>
                  {!client.googleSheetUrl && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sin Sheet configurado
                    </p>
                  )}
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
                    {leadsStats?.withEmail ?? "—"}
                  </p>
                  {leadsStats && leadsStats.total > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>
                          {Math.round(
                            (leadsStats.withEmail / leadsStats.total) * 100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${(leadsStats.withEmail / leadsStats.total) * 100}%`,
                          }}
                        />
                      </div>
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
                    {leadsStats?.withPhone ?? "—"}
                  </p>
                  {leadsStats && leadsStats.total > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>
                          {Math.round(
                            (leadsStats.withPhone / leadsStats.total) * 100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${(leadsStats.withPhone / leadsStats.total) * 100}%`,
                          }}
                        />
                      </div>
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
                    {leadsStats?.withWebsite ?? "—"}
                  </p>
                  {leadsStats && leadsStats.total > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>
                          {Math.round(
                            (leadsStats.withWebsite / leadsStats.total) * 100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{
                            width: `${(leadsStats.withWebsite / leadsStats.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Automation metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card style={{ borderRadius: 12 }}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Workflow className="size-3.5" />
                    Workflows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {activeWfCount}
                    <span className="text-lg text-muted-foreground">
                      /{totalWfCount}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">activos</p>
                </CardContent>
              </Card>
              <Card style={{ borderRadius: 12 }}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Activity className="size-3.5" />
                    Ejecuciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {execStats?.total ?? "—"}
                  </p>
                  {execStats && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-emerald-600">
                        {execStats.success} ok
                      </span>
                      {execStats.error > 0 && (
                        <span className="text-xs text-red-500">
                          {execStats.error} error
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card style={{ borderRadius: 12 }}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <TrendingUp className="size-3.5" />
                    Tasa de Exito
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {execStats && execStats.total > 0 ? (
                    <>
                      <p className="text-3xl font-bold">
                        {Math.round(
                          (execStats.success / execStats.total) * 100,
                        )}
                        %
                      </p>
                      <div className="mt-2 h-1.5 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            execStats.success / execStats.total >= 0.9
                              ? "bg-emerald-500"
                              : execStats.success / execStats.total >= 0.7
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${(execStats.success / execStats.total) * 100}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-muted-foreground">
                      —
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card style={{ borderRadius: 12 }}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    Ultima Ejecucion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {execStats?.lastDate ? (
                    <>
                      <p className="text-lg font-bold">
                        {format(new Date(execStats.lastDate), "dd/MM")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(execStats.lastDate), "HH:mm")} hs
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-muted-foreground">
                      Sin ejecuciones
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Leads by date - Area Chart */}
              {leadsStats && leadsStats.byDate.length > 0 ? (
                <Card style={{ borderRadius: 12 }}>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      Leads por Fecha
                    </CardTitle>
                    <CardDescription>
                      Ultimos {Math.min(leadsStats.byDate.length, 30)} dias con
                      datos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={leadsStats.byDate.slice(-30)}
                          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="clientLeadsGradient"
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
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "var(--color-popover, #fff)",
                              border: "1px solid var(--color-border, #e5e7eb)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#7C3AED"
                            strokeWidth={2}
                            fill="url(#clientLeadsGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card style={{ borderRadius: 12 }}>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      Leads por Fecha
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                      No hay datos de fecha disponibles
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contactability summary */}
              {leadsStats && leadsStats.total > 0 && (
                <Card style={{ borderRadius: 12 }}>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      Contactabilidad
                    </CardTitle>
                    <CardDescription>
                      Datos de contacto disponibles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        label: "Email",
                        value: leadsStats.withEmail,
                        color: "bg-emerald-500",
                        icon: Mail,
                      },
                      {
                        label: "Telefono",
                        value: leadsStats.withPhone,
                        color: "bg-blue-500",
                        icon: Phone,
                      },
                      {
                        label: "Website",
                        value: leadsStats.withWebsite,
                        color: "bg-violet-500",
                        icon: FileText,
                      },
                    ].map((item) => {
                      const pct = Math.round(
                        (item.value / leadsStats.total) * 100,
                      );
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
                            <div
                              className={`h-full rounded-full ${item.color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Summary line */}
                    <div className="border-t pt-3 mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          Con algun dato de contacto
                        </span>
                        <span className="font-bold text-[#7C3AED]">
                          {Math.max(leadsStats.withEmail, leadsStats.withPhone)}{" "}
                          / {leadsStats.total}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Data quality + Top values */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Fill rate */}
              {leadsStats && Object.keys(leadsStats.fillRate).length > 0 && (
                <Card style={{ borderRadius: 12 }}>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      Calidad de Datos
                    </CardTitle>
                    <CardDescription>
                      Porcentaje de campos completados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {Object.entries(leadsStats.fillRate)
                        .sort(([, a], [, b]) => b - a)
                        .map(([col, pct]) => (
                          <div key={col} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="truncate text-muted-foreground">
                                {col}
                              </span>
                              <span
                                className={`font-medium ${pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}
                              >
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

              {/* Top values */}
              {leadsStats && Object.keys(leadsStats.topValues).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(leadsStats.topValues).map(([col, values]) => (
                    <Card key={col} style={{ borderRadius: 12 }}>
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold">
                          Top {col}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {values.map((v, i) => {
                            const maxCount = values[0].count;
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-5 shrink-0 text-xs text-muted-foreground text-right">
                                  {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="truncate text-sm">
                                      {v.value}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="ml-2 shrink-0"
                                    >
                                      {v.count}
                                    </Badge>
                                  </div>
                                  <div className="h-1 rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-[#7C3AED]/60"
                                      style={{
                                        width: `${(v.count / maxCount) * 100}%`,
                                      }}
                                    />
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

            {/* Client Info + Billing row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card style={{ borderRadius: 12 }}>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Informacion del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-4 text-muted-foreground" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.notes && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="size-4 mt-0.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {client.notes}
                      </span>
                    </div>
                  )}
                  {!client.email && !client.phone && !client.notes && (
                    <p className="text-sm text-muted-foreground">
                      No hay informacion adicional
                    </p>
                  )}
                  <div className="border-t pt-3 text-xs text-muted-foreground">
                    Creado el {format(new Date(client.createdAt), "dd/MM/yyyy")}
                    {client.updatedAt !== client.createdAt && (
                      <>
                        {" "}
                        · Actualizado{" "}
                        {format(new Date(client.updatedAt), "dd/MM/yyyy")}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Billing */}
              <Card style={{ borderRadius: 12 }}>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Facturacion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client.monthlyAmount || client.nextPaymentDate ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground">Monto Mensual</p>
                          <p className="text-2xl font-bold">
                            {client.monthlyAmount
                              ? `$${client.monthlyAmount.toLocaleString()}`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Metodo</p>
                          <p className="font-medium">
                            {client.paymentMethod || "—"}
                          </p>
                        </div>
                      </div>
                      {client.nextPaymentDate && (
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">
                            Proximo Pago
                          </p>
                          <p className="text-lg font-semibold">
                            {format(
                              new Date(client.nextPaymentDate),
                              "dd/MM/yyyy",
                            )}
                          </p>
                          {(() => {
                            const days = differenceInDays(
                              new Date(client.nextPaymentDate),
                              new Date(),
                            );
                            return (
                              <Badge
                                variant={
                                  days < 0
                                    ? "destructive"
                                    : days <= 7
                                      ? "outline"
                                      : "default"
                                }
                                className="mt-1"
                              >
                                {days < 0
                                  ? `Vencido hace ${Math.abs(days)} dias`
                                  : days === 0
                                    ? "Vence hoy"
                                    : `En ${days} dias`}
                              </Badge>
                            );
                          })()}
                        </div>
                      )}
                      {leadsStats &&
                        leadsStats.total > 0 &&
                        client.monthlyAmount && (
                          <div className="border-t pt-3 text-sm">
                            <p className="text-muted-foreground">
                              Costo por Lead
                            </p>
                            <p className="text-lg font-bold text-[#7C3AED]">
                              $
                              {(
                                client.monthlyAmount / leadsStats.total
                              ).toFixed(2)}
                            </p>
                          </div>
                        )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin facturacion configurada
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Workflows summary */}
            {totalWfCount > 0 && (
              <Card style={{ borderRadius: 12 }}>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Workflows Asignados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {client.workflows.map((wf) => (
                      <div
                        key={wf.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {wf.displayName}
                          </p>
                          {wf.notes && (
                            <p className="truncate text-xs text-muted-foreground">
                              {wf.notes}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={wf.active ? "default" : "secondary"}
                          className="ml-2 shrink-0"
                        >
                          {wf.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows">
          <div className="pt-4">
            <WorkflowList
              workflows={client.workflows}
              onToggle={handleToggleWorkflow}
              onDelete={handleDeleteWorkflow}
              onSaveNotes={handleSaveNotes}
              onAddWorkflow={() => setShowAddDialog(true)}
            />
          </div>
        </TabsContent>

        {/* Ejecuciones Tab */}
        <TabsContent value="ejecuciones">
          <div className="pt-4 space-y-4">
            {client.workflows.map((wf) =>
              wf.n8nWorkflowId ? (
                <LiveExecutions
                  key={wf.id}
                  title={wf.displayName}
                  workflowId={wf.n8nWorkflowId}
                  limit={20}
                />
              ) : null,
            )}
            {client.workflows.every((wf) => !wf.n8nWorkflowId) && (
              <Card style={{ borderRadius: 12 }}>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
                  <Activity className="size-8 text-muted-foreground" />
                  <p className="font-medium">Sin ejecuciones</p>
                  <p className="text-sm text-muted-foreground">
                    Asigna un workflow para ver sus ejecuciones
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="overflow-hidden">
          <div className="min-w-0 pt-4">
            <LeadsTable
              clientId={id}
              clientName={client.name}
              googleSheetUrl={client.googleSheetUrl}
              onSetSheetUrl={async (url) => {
                try {
                  const res = await fetch(`/api/clients/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ googleSheetUrl: url }),
                  });
                  if (!res.ok) throw new Error();
                  queryClient.invalidateQueries({ queryKey: ["clients", id] });
                  toast.success("Google Sheet configurado");
                } catch {
                  toast.error("Error al guardar URL");
                }
              }}
            />
          </div>
        </TabsContent>

        {/* Facturacion Tab */}
        <TabsContent value="facturacion">
          <BillingTab
            client={client}
            payments={(client.payments ?? []) as PaymentRecord[]}
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: ["clients", id] })
            }
          />
        </TabsContent>
      </Tabs>

      <AddWorkflowDialog
        clientId={id}
        assignedWorkflowIds={client.workflows
          .map((w) => w.n8nWorkflowId)
          .filter((id): id is string => id !== null)}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSelect={handleAssignWorkflow}
        isLoading={addWorkflow.isPending}
      />
    </div>
  );
}
