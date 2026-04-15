"use client";

import React, { useState } from "react";
import { RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import {
  useWorkflows,
  useActivateWorkflow,
  useDeactivateWorkflow,
  useSyncWorkflows,
  useDeleteWorkflow,
  useHiddenWorkflows,
} from "@/hooks/use-workflows";
import { useClients } from "@/hooks/use-clients";

export default function WorkflowsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: workflows, isLoading, error } = useWorkflows();
  const { data: clients } = useClients();
  const activateMutation = useActivateWorkflow();
  const deactivateMutation = useDeactivateWorkflow();
  const syncMutation = useSyncWorkflows();
  const deleteMutation = useDeleteWorkflow();
  const { hiddenIds, hide, restore, restoreAll } = useHiddenWorkflows();

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: () => toast.success("Workflows sincronizados correctamente"),
      onError: () => toast.error("Error al sincronizar workflows"),
    });
  };

  const handleActivate = (id: string) => {
    activateMutation.mutate(id, {
      onSuccess: () => toast.success("Workflow activado"),
      onError: () => toast.error("Error al activar workflow"),
    });
  };

  const handleDeactivate = (id: string) => {
    deactivateMutation.mutate(id, {
      onSuccess: () => toast.success("Workflow desactivado"),
      onError: () => toast.error("Error al desactivar workflow"),
    });
  };

  const handleHide = (id: string) => {
    hide(id);
    toast.success("Workflow oculto", {
      action: {
        label: "Deshacer",
        onClick: () => restore(id),
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Workflow eliminado de n8n");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Error al eliminar workflow"),
    });
  };

  const getClientName = (workflowId: string): string | undefined => {
    if (!clients) return undefined;
    for (const client of clients) {
      const cw = client.workflows.find((w) => w.n8nWorkflowId === workflowId);
      if (cw) return `${client.name} — ${cw.displayName}`;
    }
    return undefined;
  };

  const visibleWorkflows = workflows?.filter((w) => !hiddenIds.has(w.id));
  const hiddenWorkflows = workflows?.filter((w) => hiddenIds.has(w.id));

  const filteredWorkflows = visibleWorkflows?.filter((w) => {
    if (filter === "active") return w.active;
    if (filter === "inactive") return !w.active;
    return true;
  });

  const hiddenCount = hiddenWorkflows?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Workflows</h2>
        <Button
          onClick={handleSync}
          disabled={syncMutation.isPending}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
          />
          Sincronizar
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="inactive">Inactivos</TabsTrigger>
          {hiddenCount > 0 && (
            <TabsTrigger value="hidden">
              Ocultos ({hiddenCount})
            </TabsTrigger>
          )}
        </TabsList>

        {filter === "hidden" ? (
          <TabsContent value="hidden">
            <div className="mb-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={restoreAll}>
                <Eye className="mr-2 h-4 w-4" />
                Restaurar todos
              </Button>
            </div>
            {hiddenWorkflows && hiddenWorkflows.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hiddenWorkflows.map((workflow) => (
                  <div key={workflow.id} className="relative">
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          restore(workflow.id);
                          toast.success("Workflow restaurado");
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Restaurar
                      </Button>
                    </div>
                    <div className="pointer-events-none opacity-50">
                      <WorkflowCard
                        workflow={workflow}
                        clientName={getClientName(workflow.id)}
                        onActivate={() => {}}
                        onDeactivate={() => {}}
                        onHide={() => {}}
                        onDelete={() => {}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border bg-white text-sm text-muted-foreground dark:bg-card">
                No hay workflows ocultos.
              </div>
            )}
          </TabsContent>
        ) : (
          <TabsContent value={filter}>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <div className="flex h-48 items-center justify-center rounded-xl border bg-white text-sm text-red-500 dark:bg-card">
                Error al cargar workflows. Intenta de nuevo.
              </div>
            ) : filteredWorkflows && filteredWorkflows.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredWorkflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    clientName={getClientName(workflow.id)}
                    onActivate={handleActivate}
                    onDeactivate={handleDeactivate}
                    onHide={handleHide}
                    onDelete={() =>
                      setDeleteTarget({ id: workflow.id, name: workflow.name })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border bg-white text-sm text-muted-foreground dark:bg-card">
                No se encontraron workflows.
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar workflow</DialogTitle>
            <DialogDescription>
              Esto eliminará permanentemente{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              de n8n. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
