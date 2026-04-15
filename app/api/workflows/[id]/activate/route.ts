import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await n8nService.activateWorkflow(id);

    await prisma.clientWorkflow.updateMany({
      where: { n8nWorkflowId: id },
      data: { active: true },
    });

    return NextResponse.json({ message: "Workflow activado exitosamente" });
  } catch (error) {
    console.error("Error activating workflow:", error);
    return NextResponse.json(
      { error: "Error al activar workflow" },
      { status: 500 }
    );
  }
}
