"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";

interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastSignIn: string | null;
}

const ROLE_BADGE_VARIANT: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  worker: "secondary",
  client: "outline",
};

export default function UsersPage() {
  const { role, permissions, loading: userLoading } = useUser();
  const { data: clients } = useClients();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState<AppUser | null>(null);

  // Create form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("worker");
  const [creating, setCreating] = useState(false);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleCreate() {
    if (!newEmail || !newPassword) return;
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Usuario ${newEmail} creado como ${ROLE_LABELS[newRole]}`);
      setShowCreateDialog(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("worker");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  }

  async function handleChangeRole(userId: string, newRole: UserRole) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      toast.success("Rol actualizado");
      fetchUsers();
    } catch {
      toast.error("Error al cambiar rol");
    }
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`Eliminar usuario ${email}?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  }

  async function handleAssignClient(userId: string, clientId: string, assign: boolean) {
    try {
      const client = clients?.find((c) => c.id === clientId);
      if (!client) return;

      const currentIds = client.assignedUserIds ?? [];
      const newIds = assign
        ? [...new Set([...currentIds, userId])]
        : currentIds.filter((id) => id !== userId);

      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedUserIds: newIds }),
      });
      if (!res.ok) throw new Error();
      toast.success(assign ? "Cliente asignado" : "Cliente desasignado");
    } catch {
      toast.error("Error al asignar cliente");
    }
  }

  if (userLoading) return null;
  if (!permissions.canManageUsers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">No tenes permisos para ver esta pagina.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona cuentas y permisos</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="size-4" />
          Crear Usuario
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <Card style={{ borderRadius: 12 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Clientes Asignados</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const assignedClients = clients?.filter((c) =>
                  c.assignedUserIds?.includes(user.id)
                ) ?? [];

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(val) =>
                          val && handleChangeRole(user.id, val as UserRole)
                        }
                      >
                        <SelectTrigger className="w-36 h-8">
                          <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="worker">Trabajador</SelectItem>
                          <SelectItem value="client">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.role !== "admin" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAssignDialog(user)}
                        >
                          {assignedClients.length > 0
                            ? `${assignedClients.length} cliente${assignedClients.length > 1 ? "s" : ""}`
                            : "Asignar"}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Todos
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(user.id, user.email ?? "")}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Contrasena *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={newRole}
                onValueChange={(val) => val && setNewRole(val as UserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador — acceso total</SelectItem>
                  <SelectItem value="worker">Trabajador — clientes asignados</SelectItem>
                  <SelectItem value="client">Cliente — solo sus metricas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newEmail || !newPassword}>
              {creating ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Clients Dialog */}
      <Dialog
        open={showAssignDialog !== null}
        onOpenChange={(open) => !open && setShowAssignDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Asignar Clientes a {showAssignDialog?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {clients?.map((client) => {
              const isAssigned = client.assignedUserIds?.includes(
                showAssignDialog?.id ?? ""
              );
              return (
                <button
                  key={client.id}
                  onClick={() =>
                    showAssignDialog &&
                    handleAssignClient(showAssignDialog.id, client.id, !isAssigned)
                  }
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent ${
                    isAssigned ? "border-primary bg-accent/50" : ""
                  }`}
                >
                  <span className="text-sm font-medium">{client.name}</span>
                  {isAssigned && (
                    <Badge variant="default">Asignado</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
