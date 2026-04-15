import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";

export async function POST() {
  try {
    const workflows = await n8nService.getAllWorkflows();

    let synced = 0;

    for (const workflow of workflows) {
      // Check if a ClientWorkflow exists with this n8n workflow ID
      const clientWorkflow = await prisma.clientWorkflow.findUnique({
        where: { n8nWorkflowId: workflow.id },
      });

      if (clientWorkflow) {
        if (clientWorkflow.active !== workflow.active) {
          await prisma.clientWorkflow.update({
            where: { id: clientWorkflow.id },
            data: { active: workflow.active },
          });
          synced++;
        }
      }
    }

    return NextResponse.json({
      message: "Sync completed",
      totalWorkflows: workflows.length,
      workflowsUpdated: synced,
    });
  } catch (error) {
    console.error("Error syncing workflows:", error);
    return NextResponse.json(
      { error: "Error al sincronizar workflows" },
      { status: 500 }
    );
  }
}
