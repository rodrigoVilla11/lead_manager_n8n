"use client";

import { useState } from "react";
import type { N8nWorkflow } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Workflow, Check } from "lucide-react";
import { useWorkflows } from "@/hooks/use-workflows";

interface AddWorkflowDialogProps {
  clientId: string;
  /** n8n workflow IDs already assigned to this client */
  assignedWorkflowIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (n8nWorkflowId: string, displayName: string) => void;
  isLoading?: boolean;
}

export function AddWorkflowDialog({
  clientId,
  assignedWorkflowIds,
  open,
  onOpenChange,
  onSelect,
  isLoading,
}: AddWorkflowDialogProps) {
  const { data: workflows, isLoading: loadingWorkflows } = useWorkflows();
  const [search, setSearch] = useState("");

  // Only show workflows that start with "BASE"
  const baseWorkflows = workflows?.filter((w) =>
    w.name.toUpperCase().startsWith("BASE")
  );

  const filtered = baseWorkflows?.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const isAssigned = (wf: N8nWorkflow) =>
    assignedWorkflowIds.includes(wf.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar Workflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loadingWorkflows ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : !filtered || filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Workflow className="size-8 text-muted-foreground/50" />
              <p>No se encontraron workflows en n8n</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((wf) => {
                const assigned = isAssigned(wf);
                return (
                  <button
                    key={wf.id}
                    type="button"
                    disabled={assigned || isLoading}
                    onClick={() => onSelect(wf.id, wf.name)}
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {wf.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {wf.active ? "Activo en n8n" : "Inactivo en n8n"}
                      </p>
                    </div>
                    {assigned ? (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        <Check className="mr-1 size-3" />
                        Asignado
                      </Badge>
                    ) : (
                      <Badge
                        variant={wf.active ? "default" : "outline"}
                        className="ml-2 shrink-0"
                      >
                        {wf.active ? "Activo" : "Inactivo"}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
