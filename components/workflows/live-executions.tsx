"use client";

import { useEffect, useState, useCallback } from "react";
import type { N8nExecution } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Activity, CheckCircle, XCircle, Clock, Loader2, Timer, Hash } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof CheckCircle;
}> = {
  success: { label: "Exitoso", variant: "default", icon: CheckCircle },
  error: { label: "Error", variant: "destructive", icon: XCircle },
  running: { label: "Ejecutando", variant: "secondary", icon: Loader2 },
  waiting: { label: "Esperando", variant: "outline", icon: Clock },
};

function formatDuration(startedAt: string, stoppedAt?: string): string {
  if (!stoppedAt) return "En curso...";
  const ms = new Date(stoppedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

interface LiveExecutionsProps {
  title?: string;
  workflowId?: string;
  autoRefresh?: boolean;
  limit?: number;
}

export function LiveExecutions({
  title,
  workflowId,
  autoRefresh = true,
  limit = 15,
}: LiveExecutionsProps) {
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExecutions = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (workflowId) params.set("workflowId", workflowId);
      params.set("limit", String(limit));
      const res = await fetch(`/api/executions?${params}`);
      if (res.ok) {
        setExecutions(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workflowId, limit]);

  useEffect(() => {
    fetchExecutions();
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchExecutions(), 10000);
    return () => clearInterval(interval);
  }, [fetchExecutions, autoRefresh]);

  const runningCount = executions.filter((e) => e.status === "running").length;
  const successCount = executions.filter((e) => e.status === "success").length;
  const errorCount = executions.filter((e) => e.status === "error").length;

  // Average duration of completed executions
  const completedExecs = executions.filter((e) => e.stoppedAt);
  const avgDurationMs = completedExecs.length > 0
    ? completedExecs.reduce((sum, e) => {
        return sum + (new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime());
      }, 0) / completedExecs.length
    : 0;

  const avgDuration = avgDurationMs > 0
    ? avgDurationMs < 1000
      ? `${Math.round(avgDurationMs)}ms`
      : avgDurationMs < 60000
        ? `${Math.round(avgDurationMs / 1000)}s`
        : `${Math.floor(avgDurationMs / 60000)}m ${Math.round((avgDurationMs % 60000) / 1000)}s`
    : "—";

  if (loading) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            {title ?? "Ejecuciones en vivo"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 12 }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">
              {title ?? "Ejecuciones en vivo"}
            </CardTitle>
            {runningCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                {runningCount} ejecutando
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => fetchExecutions(true)}
            disabled={refreshing}
            aria-label="Refrescar"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Summary stats */}
        {executions.length > 0 && (
          <div className="flex items-center gap-4 pt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="size-3" />
              {executions.length} ejecuciones
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="size-3" />
              {successCount} exitosas
            </span>
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <XCircle className="size-3" />
                {errorCount} errores
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="size-3" />
              Promedio: {avgDuration}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Activity className="size-6 text-muted-foreground/50" />
            <p>Sin ejecuciones recientes</p>
          </div>
        ) : (
          <div className="space-y-1">
            {executions.map((exec) => {
              const cfg = STATUS_CONFIG[exec.status] ?? STATUS_CONFIG.waiting;
              const Icon = cfg.icon;
              const duration = formatDuration(exec.startedAt, exec.stoppedAt);
              return (
                <div
                  key={exec.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    exec.status === "running" ? "bg-accent/50" : ""
                  }`}
                >
                  <Icon
                    className={`size-4 shrink-0 ${
                      exec.status === "running" ? "animate-spin" : ""
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(exec.startedAt), "dd/MM HH:mm:ss")}
                      </p>
                      <span className="text-xs text-muted-foreground/60">·</span>
                      <p className="text-xs text-muted-foreground">
                        {duration}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(exec.startedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                      {exec.mode !== "trigger" && ` · ${exec.mode}`}
                    </p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
