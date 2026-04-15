"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateClient } from "@/hooks/use-clients";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { CreateClientInput } from "@/types";

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();

  function handleSubmit(data: CreateClientInput) {
    createClient.mutate(data, {
      onSuccess: () => {
        toast.success("Cliente creado exitosamente");
        router.push("/clients");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Error al crear cliente"
        );
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/clients" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h1>
          <p className="text-muted-foreground">
            Configura un nuevo cliente y su scrapper de leads
          </p>
        </div>
      </div>

      <ClientForm
        onSubmit={handleSubmit}
        isLoading={createClient.isPending}
      />
    </div>
  );
}
