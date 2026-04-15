import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        workflows: {
          include: {
            executions: {
              orderBy: { startedAt: "desc" },
              take: 10,
            },
          },
        },
        payments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedUserIds !== undefined) updateData.assignedUserIds = body.assignedUserIds;
    if (body.googleSheetUrl !== undefined) updateData.googleSheetUrl = body.googleSheetUrl || null;

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
      include: { workflows: true },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: { workflows: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Deactivate all linked n8n workflows
    for (const wf of client.workflows) {
      if (wf.n8nWorkflowId) {
        try {
          await n8nService.deactivateWorkflow(wf.n8nWorkflowId);
        } catch (n8nError) {
          console.error("Error deactivating n8n workflow:", n8nError);
        }
      }
    }

    await prisma.client.delete({ where: { id } });

    return NextResponse.json({ message: "Cliente eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    );
  }
}
