import { z } from "zod";

export const workflowConfigSchema = z.object({
  nichos: z.string().min(1, "Los nichos son requeridos"),
  regiones: z.string().min(1, "Las regiones son requeridas"),
  pais: z.string().min(1, "El país es requerido"),
  producto: z.string().min(1, "El producto es requerido"),
  propuestaValor: z.string().optional(),
  googleSheetUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  maxResultados: z.coerce.number().min(1).max(100).optional().default(20),
  intervaloMinutos: z.coerce.number().min(1).max(1440).optional().default(5),
});

export const createClientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  workflow: z
    .object({
      displayName: z.string().min(1, "El nombre del workflow es requerido"),
      config: workflowConfigSchema.optional(),
    })
    .optional(),
});

export const addWorkflowSchema = z.object({
  clientId: z.string().min(1),
  displayName: z.string().min(1, "El nombre del workflow es requerido"),
  n8nWorkflowId: z.string().optional(),
  config: workflowConfigSchema.optional(),
});

export const updateWorkflowSchema = z.object({
  displayName: z.string().min(1).optional(),
  notes: z.string().optional(),
  nichos: z.string().optional(),
  regiones: z.string().optional(),
  pais: z.string().optional(),
  producto: z.string().optional(),
  propuestaValor: z.string().optional(),
  googleSheetUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  maxResultados: z.coerce.number().min(1).max(100).optional(),
  intervaloMinutos: z.coerce.number().min(1).max(1440).optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;
export type AddWorkflowFormData = z.infer<typeof addWorkflowSchema>;
export type UpdateWorkflowFormData = z.infer<typeof updateWorkflowSchema>;
export type WorkflowConfigFormData = z.infer<typeof workflowConfigSchema>;
