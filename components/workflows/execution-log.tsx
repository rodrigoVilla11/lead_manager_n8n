"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Execution {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  leadsFound: number;
  emailsExtracted: number;
  errorMessage?: string;
  n8nExecutionId?: string;
}

interface ExecutionLogProps {
  executions: Execution[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  SUCCESS: {
    label: "OK",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  ERROR: {
    label: "Error",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  RUNNING: {
    label: "Ejecutando",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  WAITING: {
    label: "Esperando",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
  },
};

function formatDuration(startedAt: string, finishedAt?: string): string {
  if (!finishedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  const diffMs = end - start;
  if (diffMs < 0) return "—";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ExecutionLog({ executions }: ExecutionLogProps) {
  if (!executions || executions.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border bg-white text-sm text-muted-foreground dark:bg-card">
        No hay ejecuciones registradas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white dark:bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estado</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Duraci&oacute;n</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Emails</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((execution) => {
            const status =
              statusConfig[execution.status] ?? statusConfig.WAITING;

            return (
              <TableRow key={execution.id}>
                <TableCell>
                  <Badge
                    className={cn(
                      "pointer-events-none border-0 text-xs",
                      status.className
                    )}
                  >
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(execution.startedAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDuration(execution.startedAt, execution.finishedAt)}
                </TableCell>
                <TableCell className="text-right">
                  {execution.leadsFound}
                </TableCell>
                <TableCell className="text-right">
                  {execution.emailsExtracted}
                </TableCell>
                <TableCell>
                  {execution.errorMessage ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="block max-w-[200px] truncate text-xs text-red-600 dark:text-red-400">
                            {execution.errorMessage}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {execution.errorMessage}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
