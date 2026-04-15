import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractSpreadsheetId, getSheetData } from "@/lib/google-sheets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);
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
      return NextResponse.json({
        headers: [],
        rows: [],
        total: 0,
        sheetTitle: "",
        availableSheets: [],
      });
    }

    const spreadsheetId = extractSpreadsheetId(client.googleSheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "URL de Google Sheet invalida" },
        { status: 400 }
      );
    }

    const data = await getSheetData(spreadsheetId, sheet, page, limit);

    return NextResponse.json({
      ...data,
      page,
      limit,
      totalPages: Math.ceil(data.total / limit),
    });
  } catch (error) {
    console.error("Error al obtener leads:", error);
    const message =
      error instanceof Error ? error.message : "Error al obtener leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
