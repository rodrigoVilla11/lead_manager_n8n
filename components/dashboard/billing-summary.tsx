"use client";

import { useRouter } from "next/navigation";
import type { ClientWithWorkflows } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface BillingSummaryProps {
  clients: ClientWithWorkflows[];
}

interface ClientBillingInfo {
  id: string;
  name: string;
  monthlyAmount: number;
  nextPaymentDate: string;
  daysUntil: number;
  status: "overdue" | "soon" | "ok";
}

export function BillingSummary({ clients }: BillingSummaryProps) {
  const router = useRouter();

  const billingClients: ClientBillingInfo[] = clients
    .filter((c) => c.nextPaymentDate && c.monthlyAmount)
    .map((c) => {
      const next = new Date(c.nextPaymentDate!);
      const days = differenceInDays(next, new Date());
      let status: "overdue" | "soon" | "ok" = "ok";
      if (isPast(next)) status = "overdue";
      else if (days <= 7) status = "soon";

      return {
        id: c.id,
        name: c.name,
        monthlyAmount: c.monthlyAmount!,
        nextPaymentDate: c.nextPaymentDate!,
        daysUntil: days,
        status,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const overdue = billingClients.filter((c) => c.status === "overdue");
  const soon = billingClients.filter((c) => c.status === "soon");
  const ok = billingClients.filter((c) => c.status === "ok");

  if (billingClients.length === 0) return null;

  return (
    <Card className="rounded-xl bg-white dark:bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Estado de Pagos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {overdue.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/clients/${c.id}`)}
            className="flex w-full items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-950/50"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Vencido hace {Math.abs(c.daysUntil)} dias
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold">
              ${c.monthlyAmount.toLocaleString()}
            </span>
          </button>
        ))}

        {soon.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/clients/${c.id}`)}
            className="flex w-full items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-left transition-colors hover:bg-yellow-100 dark:border-yellow-900 dark:bg-yellow-950/30 dark:hover:bg-yellow-950/50"
          >
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Vence en {c.daysUntil} dias
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold">
              ${c.monthlyAmount.toLocaleString()}
            </span>
          </button>
        ))}

        {ok.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/clients/${c.id}`)}
            className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(c.nextPaymentDate), "dd MMM", {
                    locale: es,
                  })}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold">
              ${c.monthlyAmount.toLocaleString()}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
