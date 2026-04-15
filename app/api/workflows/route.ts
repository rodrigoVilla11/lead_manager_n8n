import { NextResponse } from "next/server";
import { n8nService } from "@/lib/n8n-service";

export async function GET() {
  try {
    const workflows = await n8nService.getAllWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Error al obtener workflows de n8n" },
      { status: 500 }
    );
  }
}
