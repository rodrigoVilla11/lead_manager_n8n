import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await n8nService.deactivateWorkflow(id);

    await prisma.clientWorkflow.updateMany({
      where: { n8nWorkflowId: id },
      data: { active: false },
    });

    return NextResponse.json({
      message: "Workflow desactivado exitosamente",
    });
  } catch (error) {
    console.error("Error deactivating workflow:", error);
    return NextResponse.json(
      { error: "Error al desactivar workflow" },
      { status: 500 }
    );
  }
}
