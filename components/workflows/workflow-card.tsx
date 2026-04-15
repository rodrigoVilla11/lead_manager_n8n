"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MoreVertical, EyeOff, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkflowStatus } from "@/components/workflows/workflow-status";

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
}

interface WorkflowCardProps {
  workflow: Workflow;
  clientName?: string;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkflowCard({
  workflow,
  clientName,
  onActivate,
  onDeactivate,
  onHide,
  onDelete,
}: WorkflowCardProps) {
  const n8nEditorUrl = process.env.NEXT_PUBLIC_N8N_EDITOR_URL;

  const handleToggle = (checked: boolean) => {
    if (checked) {
      onActivate(workflow.id);
    } else {
      onDeactivate(workflow.id);
    }
  };

  return (
    <Card className="rounded-xl bg-white dark:bg-card">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-sm font-semibold">
            {workflow.name}
          </CardTitle>
          {clientName && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {clientName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <WorkflowStatus active={workflow.active} />
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onHide(workflow.id)}>
                <EyeOff className="mr-2 h-4 w-4" />
                Ocultar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(workflow.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar de n8n
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Actualizado{" "}
            {formatDistanceToNow(new Date(workflow.updatedAt), {
              addSuffix: true,
              locale: es,
            })}
          </p>
          <Switch
            checked={workflow.active}
            onCheckedChange={handleToggle}
          />
        </div>
        {n8nEditorUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            render={
              <a
                href={`${n8nEditorUrl}/workflow/${workflow.id}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLink className="size-3.5" />
            Abrir en n8n
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
