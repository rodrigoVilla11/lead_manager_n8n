import React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Execution {
  id: string;
  clientName: string;
  status: string;
  startedAt: string;
  leadsFound: number;
  emailsExtracted: number;
}

interface RecentActivityProps {
  executions: Execution[];
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  SUCCESS: {
    label: "Success",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  RUNNING: {
    label: "Running",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  WAITING: {
    label: "Waiting",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
  },
};

export function RecentActivity({ executions }: RecentActivityProps) {
  if (!executions || executions.length === 0) {
    return (
      <Card className="rounded-xl bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No hay ejecuciones recientes.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl bg-white dark:bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="space-y-0 px-4 pb-4">
            {executions.map((execution) => {
              const status = statusConfig[execution.status] ?? statusConfig.WAITING;

              return (
                <div
                  key={execution.id}
                  className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {execution.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(execution.startedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {execution.leadsFound} leads
                    </span>
                    <Badge
                      className={cn(
                        "pointer-events-none border-0 text-xs",
                        status.className
                      )}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
