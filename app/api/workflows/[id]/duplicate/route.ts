import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";
import type { WorkflowConfig } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: {
      clientId: string;
      displayName: string;
      config: WorkflowConfig;
    } = await request.json();

    if (!body.clientId || !body.displayName || !body.config) {
      return NextResponse.json(
        { error: "clientId, displayName, and config are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: body.clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const newWorkflow = await n8nService.duplicateWorkflowForClient(
      id,
      `${client.name} - ${body.displayName}`,
      body.config
    );

    // Create a ClientWorkflow record linking the new n8n workflow to the client
    const clientWorkflow = await prisma.clientWorkflow.create({
      data: {
        clientId: body.clientId,
        displayName: body.displayName,
        n8nWorkflowId: newWorkflow.id,
        active: false,
        nichos: body.config.nichos,
        regiones: body.config.regiones,
        pais: body.config.pais,
        producto: body.config.producto,
        propuestaValor: body.config.propuestaValor,
        maxResultados: body.config.maxResultados ?? 20,
        googleSheetUrl: body.config.googleSheetUrl,
      },
    });

    return NextResponse.json(
      { workflow: newWorkflow, clientWorkflow },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error duplicating workflow:", error);
    return NextResponse.json(
      { error: "Error al duplicar workflow" },
      { status: 500 }
    );
  }
}
