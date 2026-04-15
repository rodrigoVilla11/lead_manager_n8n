import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { clientId, n8nWorkflowId } = body;

    if (!clientId || !n8nWorkflowId) {
      return NextResponse.json(
        { error: "clientId y n8nWorkflowId son requeridos" },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Get the base workflow name from n8n and replace "BASE" with client name
    const baseWorkflow = await n8nService.getWorkflow(n8nWorkflowId);
    const duplicatedName = baseWorkflow.name.replace(/^BASE/i, client.name);
    const displayName = duplicatedName;

    // Duplicate the workflow in n8n
    const newWorkflow = await n8nService.duplicateWorkflow(
      n8nWorkflowId,
      duplicatedName
    );

    // Create the link in our DB pointing to the NEW duplicated workflow
    const clientWorkflow = await prisma.clientWorkflow.create({
      data: {
        clientId,
        displayName,
        n8nWorkflowId: newWorkflow.id,
        active: false,
      },
    });

    return NextResponse.json(clientWorkflow, { status: 201 });
  } catch (error) {
    console.error("Error creating client workflow:", error);
    return NextResponse.json(
      { error: "Error al duplicar y asignar el workflow" },
      { status: 500 }
    );
  }
}
