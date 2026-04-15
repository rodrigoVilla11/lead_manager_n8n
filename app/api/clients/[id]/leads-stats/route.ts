import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractSpreadsheetId, getSheetStats } from "@/lib/google-sheets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sheet = searchParams.get("sheet") ?? undefined;

    const client = await prisma.client.findUnique({
      where: { id },
      select: { googleSheetUrl: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    if (!client.googleSheetUrl) {
      return NextResponse.json({ total: 0 });
    }

    const spreadsheetId = extractSpreadsheetId(client.googleSheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "URL de Google Sheet invalida" },
        { status: 400 }
      );
    }

    const stats = await getSheetStats(spreadsheetId, sheet);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error al obtener stats de leads:", error);
    return NextResponse.json(
      { error: "Error al obtener stats" },
      { status: 500 }
    );
  }
}
