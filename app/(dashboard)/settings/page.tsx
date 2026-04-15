"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import {
  ExternalLink,
  Link2,
  Moon,
  Sun,
  RefreshCw,
  CheckCircle,
  XCircle,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSyncWorkflows } from "@/hooks/use-workflows";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const syncMutation = useSyncWorkflows();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<
    "idle" | "checking" | "ok" | "error"
  >("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    setIsChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Contrasena actualizada");
      setNewPassword("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cambiar contrasena"
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleTestConnection() {
    setN8nStatus("checking");
    try {
      const res = await fetch("/api/workflows");
      if (!res.ok) throw new Error();
      setN8nStatus("ok");
      toast.success("Conexion con n8n verificada correctamente");
    } catch {
      setN8nStatus("error");
      toast.error("No se pudo conectar con n8n");
    }
  }

  const handleSyncWorkflows = () => {
    syncMutation.mutate(undefined, {
      onSuccess: () => toast.success("Workflows sincronizados"),
      onError: () => toast.error("Error al sincronizar workflows"),
    });
  };

  const n8nEditorUrl = process.env.NEXT_PUBLIC_N8N_EDITOR_URL;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Configuracion</h2>

      {/* Account */}
      <Card className="rounded-xl bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-[#7C3AED]" />
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{userEmail ?? "—"}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="new-password">Cambiar Contrasena</Label>
            <div className="flex gap-2">
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contrasena (min 6 caracteres)"
                className="max-w-xs"
              />
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword}
                size="sm"
              >
                {isChangingPassword ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Cambiar"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* n8n Connection */}
      <Card className="rounded-xl bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-[#7C3AED]" />
            Conexion n8n
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {n8nEditorUrl && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <p className="text-sm font-mono">{n8nEditorUrl}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={n8nStatus === "checking"}
              className="gap-2"
            >
              {n8nStatus === "checking" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : n8nStatus === "ok" ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : n8nStatus === "error" ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Probar conexion
            </Button>
            {n8nStatus === "ok" && (
              <Badge variant="default">Conectado</Badge>
            )}
            {n8nStatus === "error" && (
              <Badge variant="destructive">Error</Badge>
            )}
          </div>

          <Separator />

          <Button
            variant="outline"
            onClick={handleSyncWorkflows}
            disabled={syncMutation.isPending}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            Sincronizar workflows
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="rounded-xl bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-[#7C3AED]" />
            ) : (
              <Sun className="h-4 w-4 text-[#7C3AED]" />
            )}
            Preferencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Modo oscuro</Label>
              <p className="text-xs text-muted-foreground">
                Cambiar entre tema claro y oscuro
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="rounded-xl bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-base">Informacion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium">0.1.0</span>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            {n8nEditorUrl && (
              <a
                href={n8nEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#7C3AED] hover:underline"
              >
                Panel de n8n
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <a
              href="https://docs.n8n.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#7C3AED] hover:underline"
            >
              Documentacion n8n
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
