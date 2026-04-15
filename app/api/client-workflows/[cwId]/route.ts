import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";
import { updateWorkflowSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cwId: string }> }
) {
  try {
    const { cwId } = await params;

    const clientWorkflow = await prisma.clientWorkflow.findUnique({
      where: { id: cwId },
      include: {
        client: { select: { id: true, name: true } },
        executions: {
          orderBy: { startedAt: "desc" },
          take: 20,
        },
      },
    });

    if (!clientWorkflow) {
      return NextResponse.json(
        { error: "Workflow no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(clientWorkflow);
  } catch (error) {
    console.error("Error fetching client workflow:", error);
    return NextResponse.json(
      { error: "Error al obtener el workflow" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ cwId: string }> }
) {
  try {
    const { cwId } = await params;
    const body = await request.json();
    const parsed = updateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const clientWorkflow = await prisma.clientWorkflow.findUnique({
      where: { id: cwId },
    });

    if (!clientWorkflow) {
      return NextResponse.json(
        { error: "Workflow no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.clientWorkflow.update({
      where: { id: cwId },
      data: parsed.data,
    });

    // Sync config to n8n if linked
    if (clientWorkflow.n8nWorkflowId) {
      const { displayName, ...configFields } = parsed.data;
      const hasConfigChanges = Object.keys(configFields).length > 0;

      if (hasConfigChanges) {
        try {
          const workflowConfig: Record<string, string | number | undefined> = {};
          if (configFields.nichos !== undefined) workflowConfig.nichos = configFields.nichos;
          if (configFields.regiones !== undefined) workflowConfig.regiones = configFields.regiones;
          if (configFields.pais !== undefined) workflowConfig.pais = configFields.pais;
          if (configFields.producto !== undefined) workflowConfig.producto = configFields.producto;
          if (configFields.propuestaValor !== undefined) workflowConfig.propuestaValor = configFields.propuestaValor;
          if (configFields.googleSheetUrl !== undefined) workflowConfig.googleSheetUrl = configFields.googleSheetUrl;
          if (configFields.maxResultados !== undefined) workflowConfig.maxResultados = configFields.maxResultados;

          await n8nService.updateWorkflowConfig(
            clientWorkflow.n8nWorkflowId,
            workflowConfig as Parameters<typeof n8nService.updateWorkflowConfig>[1]
          );
        } catch (error) {
          console.error("Error syncing config to n8n:", error);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating client workflow:", error);
    return NextResponse.json(
      { error: "Error al actualizar el workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ cwId: string }> }
) {
  try {
    const { cwId } = await params;

    const clientWorkflow = await prisma.clientWorkflow.findUnique({
      where: { id: cwId },
    });

    if (!clientWorkflow) {
      return NextResponse.json(
        { error: "Workflow no encontrado" },
        { status: 404 }
      );
    }

    // Deactivate in n8n if linked
    if (clientWorkflow.n8nWorkflowId) {
      try {
        await n8nService.deactivateWorkflow(clientWorkflow.n8nWorkflowId);
      } catch (error) {
        console.error("Error deactivating n8n workflow:", error);
      }
    }

    await prisma.clientWorkflow.delete({ where: { id: cwId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client workflow:", error);
    return NextResponse.json(
      { error: "Error al eliminar el workflow" },
      { status: 500 }
    );
  }
}
