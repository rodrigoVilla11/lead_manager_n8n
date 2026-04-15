import { NextResponse } from "next/server";
import { n8nService } from "@/lib/n8n-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await n8nService.deleteWorkflow(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Error al eliminar workflow de n8n" },
      { status: 500 }
    );
  }
}
