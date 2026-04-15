"use client";

import { useState } from "react";
import type { PaymentRecord, ClientWithWorkflows } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DollarSign,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit2,
  Check,
  X,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/export-csv";
import { format, isPast, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }
> = {
  PAID: { label: "Pagado", variant: "default", icon: CheckCircle },
  PENDING: { label: "Pendiente", variant: "outline", icon: Clock },
  OVERDUE: { label: "Vencido", variant: "destructive", icon: AlertCircle },
  CANCELLED: { label: "Cancelado", variant: "secondary", icon: X },
};

interface BillingTabProps {
  client: ClientWithWorkflows;
  payments: PaymentRecord[];
  onRefresh: () => void;
}

export function BillingTab({ client, payments, onRefresh }: BillingTabProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingBilling, setEditingBilling] = useState(false);

  // Billing edit state
  const [monthlyAmount, setMonthlyAmount] = useState(
    client.monthlyAmount?.toString() ?? ""
  );
  const [nextPaymentDate, setNextPaymentDate] = useState(
    client.nextPaymentDate
      ? format(new Date(client.nextPaymentDate), "yyyy-MM-dd")
      : ""
  );
  const [paymentMethod, setPaymentMethod] = useState(
    client.paymentMethod ?? ""
  );

  // New payment state
  const [payAmount, setPayAmount] = useState(
    client.monthlyAmount?.toString() ?? ""
  );
  const [payDate, setPayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payMethod, setPayMethod] = useState(client.paymentMethod ?? "");
  const [payNotes, setPayNotes] = useState("");
  const [payStatus, setPayStatus] = useState("PAID");
  const [isSaving, setIsSaving] = useState(false);

  // Compute billing status
  const billingStatus = getBillingStatus(client);

  async function saveBilling() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/billing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyAmount: monthlyAmount ? Number(monthlyAmount) : null,
          nextPaymentDate: nextPaymentDate || null,
          paymentMethod: paymentMethod || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Facturacion actualizada");
      setEditingBilling(false);
      onRefresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  }

  async function createPayment() {
    if (!payAmount || !payDate) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          amount: Number(payAmount),
          date: payDate,
          method: payMethod || undefined,
          notes: payNotes || undefined,
          status: payStatus,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pago registrado");
      setShowPaymentDialog(false);
      setPayNotes("");
      onRefresh();
    } catch {
      toast.error("Error al registrar pago");
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePayment(id: string) {
    if (!confirm("Estas seguro que deseas eliminar este pago?")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Pago eliminado");
      onRefresh();
    } catch {
      toast.error("Error al eliminar pago");
    }
  }

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 pt-4">
      {/* Billing Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card style={{ borderRadius: 12 }}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <DollarSign className="size-3.5" />
              Monto Mensual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {client.monthlyAmount
                ? `$${client.monthlyAmount.toLocaleString()}`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card style={{ borderRadius: 12 }}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Proximo Pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            {client.nextPaymentDate ? (
              <div>
                <p className="text-lg font-semibold">
                  {format(new Date(client.nextPaymentDate), "dd MMM yyyy", {
                    locale: es,
                  })}
                </p>
                <Badge variant={billingStatus.variant} className="mt-1">
                  {billingStatus.label}
                </Badge>
              </div>
            ) : (
              <p className="text-lg font-semibold text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        <Card style={{ borderRadius: 12 }}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <CreditCard className="size-3.5" />
              Total Cobrado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${totalPaid.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {payments.filter((p) => p.status === "PAID").length} pagos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Config */}
      <Card style={{ borderRadius: 12 }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configuracion de Facturacion</CardTitle>
            {!editingBilling && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingBilling(true)}
              >
                <Edit2 className="size-3.5" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        {editingBilling ? (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Monto Mensual ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Proximo Pago</Label>
                <Input
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Metodo de Pago</Label>
                <Input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Transferencia, PayPal..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingBilling(false)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={saveBilling} disabled={isSaving}>
                <Check className="size-3.5" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Monto Mensual</p>
                <p className="font-medium">
                  {client.monthlyAmount
                    ? `$${client.monthlyAmount.toLocaleString()}`
                    : "No definido"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Proximo Pago</p>
                <p className="font-medium">
                  {client.nextPaymentDate
                    ? format(
                        new Date(client.nextPaymentDate),
                        "dd/MM/yyyy"
                      )
                    : "No definido"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Metodo</p>
                <p className="font-medium">
                  {client.paymentMethod || "No definido"}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payment History */}
      <Card style={{ borderRadius: 12 }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de Pagos</CardTitle>
            <div className="flex gap-2">
              {payments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadCSV(
                      `pagos-${client.name}`,
                      ["Fecha", "Monto", "Metodo", "Estado", "Notas"],
                      payments.map((p) => [
                        format(new Date(p.date), "dd/MM/yyyy"),
                        String(p.amount),
                        p.method ?? "",
                        p.status,
                        p.notes ?? "",
                      ])
                    );
                    toast.success("CSV exportado");
                  }}
                >
                  <Download className="size-3.5" />
                  Exportar
                </Button>
              )}
              <Button size="sm" onClick={() => setShowPaymentDialog(true)}>
                <Plus className="size-3.5" />
                Registrar Pago
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <DollarSign className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No hay pagos registrados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const statusCfg =
                    PAYMENT_STATUS_CONFIG[payment.status] ??
                    PAYMENT_STATUS_CONFIG.PENDING;
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.method || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {payment.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deletePayment(payment.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Monto ($) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Metodo</Label>
                <Input
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  placeholder="Transferencia, PayPal..."
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={payStatus}
                  onValueChange={(val) => val && setPayStatus(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Pagado</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Notas del pago..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={createPayment}
              disabled={isSaving || !payAmount || !payDate}
            >
              {isSaving ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getBillingStatus(client: ClientWithWorkflows): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (!client.nextPaymentDate) {
    return { label: "Sin definir", variant: "secondary" };
  }

  const next = new Date(client.nextPaymentDate);
  const daysUntil = differenceInDays(next, new Date());

  if (isPast(next)) {
    return { label: `Vencido hace ${Math.abs(daysUntil)} dias`, variant: "destructive" };
  }
  if (daysUntil <= 7) {
    return { label: `Vence en ${daysUntil} dias`, variant: "outline" };
  }
  return { label: "Al dia", variant: "default" };
}
