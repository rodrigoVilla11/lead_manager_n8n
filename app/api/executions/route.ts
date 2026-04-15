import { NextRequest, NextResponse } from "next/server";
import { n8nService } from "@/lib/n8n-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 100);

    const executions = await n8nService.getExecutions(workflowId, limit);

    return NextResponse.json(executions);
  } catch (error) {
    console.error("Error al obtener ejecuciones:", error);
    return NextResponse.json(
      { error: "Error al obtener ejecuciones de n8n" },
      { status: 500 }
    );
  }
}
