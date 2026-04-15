import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";
import { getCurrentUser } from "@/lib/auth";
import type { CreateClientInput, WorkflowConfig } from "@/types";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const where: Record<string, unknown> = {};

    // Workers and clients only see assigned clients
    if (user && user.role !== "admin") {
      where.assignedUserIds = { has: user.id };
    }

    const clients = await prisma.client.findMany({
      where,
      include: { workflows: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateClientInput = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // 1. Create client in DB
    const client = await prisma.client.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        notes: body.notes || null,
      },
      include: { workflows: true },
    });

    // 2. If a workflow is provided, create it
    if (body.workflow) {
      let n8nWorkflowId: string | null = null;

      // If there's a template and config, duplicate the template
      const templateId = process.env.N8N_TEMPLATE_WORKFLOW_ID;
      if (templateId && body.workflow.config) {
        try {
          const workflowConfig: WorkflowConfig = {
            nichos: body.workflow.config.nichos,
            regiones: body.workflow.config.regiones,
            pais: body.workflow.config.pais,
            producto: body.workflow.config.producto,
            propuestaValor: body.workflow.config.propuestaValor ?? "",
            maxResultados: body.workflow.config.maxResultados ?? 20,
            googleSheetUrl: body.workflow.config.googleSheetUrl,
          };

          const workflow = await n8nService.duplicateWorkflowForClient(
            templateId,
            `${body.name} - ${body.workflow.displayName}`,
            workflowConfig
          );
          n8nWorkflowId = workflow.id;
        } catch (n8nError) {
          console.error("Error duplicating n8n workflow:", n8nError);
        }
      }

      await prisma.clientWorkflow.create({
        data: {
          clientId: client.id,
          displayName: body.workflow.displayName,
          n8nWorkflowId,
          active: false,
          ...(body.workflow.config && {
            nichos: body.workflow.config.nichos,
            regiones: body.workflow.config.regiones,
            pais: body.workflow.config.pais,
            producto: body.workflow.config.producto,
            propuestaValor: body.workflow.config.propuestaValor,
            googleSheetUrl: body.workflow.config.googleSheetUrl,
            maxResultados: body.workflow.config.maxResultados ?? 20,
            intervaloMinutos: body.workflow.config.intervaloMinutos ?? 5,
          }),
        },
      });

      // Re-fetch with workflows included
      const clientWithWorkflows = await prisma.client.findUnique({
        where: { id: client.id },
        include: { workflows: true },
      });

      return NextResponse.json(clientWithWorkflows, { status: 201 });
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    );
  }
}
