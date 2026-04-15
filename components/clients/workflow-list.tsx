"use client";

import React, { useState } from "react";
import type { ClientWorkflowRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Plus, Workflow, ExternalLink, StickyNote, Check, X } from "lucide-react";
import { toast } from "sonner";

interface WorkflowListProps {
  workflows: ClientWorkflowRecord[];
  onToggle: (cwId: string, n8nWorkflowId: string, active: boolean) => void;
  onDelete: (cwId: string) => void;
  onSaveNotes: (cwId: string, notes: string) => void;
  onAddWorkflow: () => void;
}

export function WorkflowList({
  workflows,
  onToggle,
  onDelete,
  onSaveNotes,
  onAddWorkflow,
}: WorkflowListProps) {
  const n8nEditorUrl = process.env.NEXT_PUBLIC_N8N_EDITOR_URL;

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  function startEditingNotes(wf: ClientWorkflowRecord) {
    setEditingNotesId(wf.id);
    setNotesValue(wf.notes ?? "");
  }

  function cancelEditingNotes() {
    setEditingNotesId(null);
    setNotesValue("");
  }

  function saveNotes(cwId: string) {
    onSaveNotes(cwId, notesValue);
    setEditingNotesId(null);
    setNotesValue("");
  }

  return (
    <div className="space-y-4">
      {workflows.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-xl border bg-white text-sm text-muted-foreground dark:bg-card">
          <Workflow className="size-8 text-muted-foreground/50" />
          <p>Este cliente no tiene workflows asignados.</p>
          <Button size="sm" onClick={onAddWorkflow}>
            <Plus className="mr-1.5 size-4" />
            Asignar Workflow
          </Button>
        </div>
      ) : (
        <>
          {workflows.map((wf) => (
            <Card key={wf.id} style={{ borderRadius: 12 }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {wf.displayName}
                    </CardTitle>
                    <Badge variant={wf.active ? "default" : "secondary"}>
                      {wf.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {wf.n8nWorkflowId && (
                      <>
                        <Switch
                          checked={wf.active}
                          onCheckedChange={(checked) =>
                            onToggle(wf.id, wf.n8nWorkflowId!, checked)
                          }
                        />
                        {n8nEditorUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            render={
                              <a
                                href={`${n8nEditorUrl}/workflow/${wf.n8nWorkflowId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          >
                            <ExternalLink className="size-3.5" />
                            Editar
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setDeleteTarget({
                          id: wf.id,
                          name: wf.displayName,
                        })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Notes */}
                {editingNotesId === wf.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Agregar notas sobre este workflow..."
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditingNotes}
                      >
                        <X className="size-3.5" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveNotes(wf.id)}
                      >
                        <Check className="size-3.5" />
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditingNotes(wf)}
                    className="flex w-full items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <StickyNote className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    {wf.notes ? (
                      <span className="text-foreground whitespace-pre-wrap">{wf.notes}</span>
                    ) : (
                      <span className="text-muted-foreground">Agregar notas...</span>
                    )}
                  </button>
                )}

                {/* Config summary if any */}
                {(wf.nichos || wf.regiones) && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {wf.nichos && (
                      <p>
                        <span className="font-medium text-foreground">
                          Nichos:
                        </span>{" "}
                        {wf.nichos.length > 80
                          ? wf.nichos.slice(0, 80) + "..."
                          : wf.nichos}
                      </p>
                    )}
                    {wf.regiones && (
                      <p>
                        <span className="font-medium text-foreground">
                          Regiones:
                        </span>{" "}
                        {wf.regiones.length > 80
                          ? wf.regiones.slice(0, 80) + "..."
                          : wf.regiones}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={onAddWorkflow}
          >
            <Plus className="mr-1.5 size-4" />
            Asignar Workflow
          </Button>
        </>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desasignar workflow</DialogTitle>
            <DialogDescription>
              Esto desvinculara{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              de este cliente. El workflow seguira existiendo en n8n.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Desasignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
