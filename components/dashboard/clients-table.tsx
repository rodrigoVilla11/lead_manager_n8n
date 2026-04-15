"use client";

import React from "react";
import { useRouter } from "next/navigation";
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

interface Workflow {
  active: boolean;
}

interface Client {
  id: string;
  name: string;
  status: string;
  totalLeads: number;
  leadsThisMonth: number;
  workflows: Workflow[];
}

interface ClientsTableProps {
  clients: Client[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Activo",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  INACTIVE: {
    label: "Inactivo",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
  },
  PAUSED: {
    label: "Pausado",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
};

export function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter();

  if (!clients || clients.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border bg-white text-sm text-muted-foreground dark:bg-card">
        No hay clientes registrados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white dark:bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Leads Total</TableHead>
            <TableHead className="text-right">Leads Mes</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Workflows</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const status = statusConfig[client.status] ?? statusConfig.INACTIVE;
            const totalWf = client.workflows.length;
            const activeWf = client.workflows.filter((w) => w.active).length;

            return (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-right">{client.totalLeads}</TableCell>
                <TableCell className="text-right">
                  {client.leadsThisMonth}
                </TableCell>
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
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {totalWf === 0
                      ? "—"
                      : `${activeWf}/${totalWf} activos`}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
