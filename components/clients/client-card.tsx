"use client";

import { useRouter } from "next/navigation";
import type { ClientWithWorkflows } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Trash2,
  Users,
  TrendingUp,
  Workflow,
} from "lucide-react";

const STATUS_CONFIG: Record<
  ClientWithWorkflows["status"],
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  ACTIVE: { label: "Activo", variant: "default" },
  PAUSED: { label: "Pausado", variant: "secondary" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

interface ClientCardProps {
  client: ClientWithWorkflows;
  onDelete?: (id: string) => void;
}

export function ClientCard({ client, onDelete }: ClientCardProps) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[client.status];

  const totalWorkflows = client.workflows.length;
  const activeWorkflows = client.workflows.filter((w) => w.active).length;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md dark:hover:shadow-lg/10"
      style={{ borderRadius: 12 }}
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="truncate">{client.name}</CardTitle>
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/clients/${client.id}`);
                }}
              >
                <Eye className="size-4" />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm(
                      `Estas seguro que deseas eliminar a ${client.name}?`
                    )
                  ) {
                    onDelete?.(client.id);
                  }
                }}
              >
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="size-3.5" />
              <span className="font-semibold text-foreground">
                {client.totalLeads}
              </span>{" "}
              totales
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="size-3.5" />
              <span className="font-semibold text-foreground">
                {client.leadsThisMonth}
              </span>{" "}
              este mes
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Workflow className="size-3.5" />
            {totalWorkflows === 0
              ? "Sin workflows"
              : `${activeWorkflows}/${totalWorkflows} activos`}
          </span>
          {totalWorkflows > 0 && (
            <Badge variant={activeWorkflows > 0 ? "default" : "secondary"}>
              {activeWorkflows > 0 ? "Activo" : "Inactivo"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
