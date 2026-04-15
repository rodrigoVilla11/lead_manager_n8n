import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractSpreadsheetId, getSheetStats } from "@/lib/google-sheets";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") ?? undefined;

    const user = await getCurrentUser();

    // Get clients with google sheet URLs
    const where: Record<string, unknown> = {
      googleSheetUrl: { not: null },
    };
    if (clientId) {
      where.id = clientId;
    } else if (user && user.role !== "admin") {
      where.assignedUserIds = { has: user.id };
    }

    const clients = await prisma.client.findMany({
      where,
      select: { id: true, name: true, googleSheetUrl: true },
    });

    // Aggregate stats from all sheets
    let totalLeads = 0;
    let totalWithEmail = 0;
    let totalWithPhone = 0;
    let totalWithWebsite = 0;
    const allByDate: Record<string, number> = {};
    const allTopValues: Record<string, Record<string, number>> = {};
    const perClient: {
      id: string;
      name: string;
      total: number;
      withEmail: number;
      withPhone: number;
    }[] = [];

    for (const client of clients) {
      if (!client.googleSheetUrl) continue;
      const spreadsheetId = extractSpreadsheetId(client.googleSheetUrl);
      if (!spreadsheetId) continue;

      try {
        const stats = await getSheetStats(spreadsheetId);

        totalLeads += stats.total;
        totalWithEmail += stats.withEmail;
        totalWithPhone += stats.withPhone;
        totalWithWebsite += stats.withWebsite;

        perClient.push({
          id: client.id,
          name: client.name,
          total: stats.total,
          withEmail: stats.withEmail,
          withPhone: stats.withPhone,
        });

        for (const d of stats.byDate) {
          allByDate[d.date] = (allByDate[d.date] ?? 0) + d.count;
        }

        for (const [col, values] of Object.entries(stats.topValues)) {
          if (!allTopValues[col]) allTopValues[col] = {};
          for (const v of values) {
            allTopValues[col][v.value] =
              (allTopValues[col][v.value] ?? 0) + v.count;
          }
        }
      } catch (error) {
        console.error(`Error reading sheet for ${client.name}:`, error);
      }
    }

    const byDate = Object.entries(allByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topValues: Record<string, { value: string; count: number }[]> = {};
    for (const [col, vals] of Object.entries(allTopValues)) {
      topValues[col] = Object.entries(vals)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    return NextResponse.json({
      totalLeads,
      totalWithEmail,
      totalWithPhone,
      totalWithWebsite,
      byDate,
      topValues,
      perClient,
      clientsWithSheet: clients.length,
    });
  } catch (error) {
    console.error("Error al obtener stats globales:", error);
    return NextResponse.json(
      { error: "Error al obtener stats" },
      { status: 500 }
    );
  }
}
