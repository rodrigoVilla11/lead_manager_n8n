"use client";

import { useState } from "react";
import type { CreateClientInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientFormProps {
  onSubmit: (data: CreateClientInput) => void;
  isLoading?: boolean;
  defaultValues?: Partial<CreateClientInput>;
}

export function ClientForm({
  onSubmit,
  isLoading,
  defaultValues,
}: ClientFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [phone, setPhone] = useState(defaultValues?.phone ?? "");
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setErrors({ name: "El nombre es requerido" });
      return;
    }

    setErrors({});
    onSubmit({
      name: name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      notes: notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card style={{ borderRadius: 12 }}>
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del cliente"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre el cliente..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? "Guardando..." : "Crear Cliente"}
        </Button>
      </div>
    </form>
  );
}
