import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { n8nService } from "@/lib/n8n-service";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") ?? undefined;
    const days = Math.min(
      Math.max(parseInt(searchParams.get("days") ?? "7", 10) || 7, 1),
      365
    );

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get the user to filter by role
    const user = await getCurrentUser();

    // Determine which n8n workflow IDs to query
    let workflowIds: string[] = [];

    if (clientId) {
      // Specific client: get their workflow IDs
      const clientWorkflows = await prisma.clientWorkflow.findMany({
        where: { clientId, n8nWorkflowId: { not: null } },
        select: { n8nWorkflowId: true },
      });
      workflowIds = clientWorkflows
        .map((cw) => cw.n8nWorkflowId!)
        .filter(Boolean);
    } else if (user && user.role !== "admin") {
      // Non-admin: only get workflows from assigned clients
      const clientWorkflows = await prisma.clientWorkflow.findMany({
        where: {
          client: { assignedUserIds: { has: user.id } },
          n8nWorkflowId: { not: null },
        },
        select: { n8nWorkflowId: true },
      });
      workflowIds = clientWorkflows
        .map((cw) => cw.n8nWorkflowId!)
        .filter(Boolean);
    }

    // Fetch executions from n8n
    let allExecutions: Array<{
      id: string;
      startedAt: string;
      stoppedAt?: string;
      status: string;
      workflowId: string;
    }> = [];

    if (clientId || (user && user.role !== "admin")) {
      // Fetch per-workflow
      for (const wfId of workflowIds) {
        try {
          const execs = await n8nService.getExecutions(wfId, 100);
          allExecutions.push(...execs);
        } catch {
          // skip failed workflows
        }
      }
    } else {
      // Admin with no filter: get all executions
      try {
        const execs = await n8nService.getExecutions(undefined, 100);
        allExecutions.push(...execs);
      } catch {
        // n8n unreachable
      }
    }

    // Filter by date range
    const filtered = allExecutions.filter(
      (e) => new Date(e.startedAt) >= since
    );

    // Build stats
    const totalExecutions = filtered.length;
    const statusCounts = filtered.reduce(
      (acc, exec) => {
        acc[exec.status] = (acc[exec.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Build leads-by-day (using execution count as proxy since n8n doesn't track leads)
    const leadsByDay: Record<string, number> = {};
    for (const exec of filtered) {
      const dateKey = new Date(exec.startedAt).toISOString().split("T")[0];
      leadsByDay[dateKey] = (leadsByDay[dateKey] ?? 0) + 1;
    }

    const leadsByDayArray = Object.entries(leadsByDay)
      .map(([date, leads]) => ({ date, leads }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recent executions for the activity feed
    const recentExecutions = filtered
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        status: e.status,
        startedAt: e.startedAt,
        finishedAt: e.stoppedAt ?? null,
        leadsFound: 0,
        emailsExtracted: 0,
      }));

    return NextResponse.json({
      totalLeads: totalExecutions,
      totalEmails: 0,
      totalExecutions,
      statusCounts,
      leadsByDay: leadsByDayArray,
      recentExecutions,
      period: {
        from: since.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error("Error al obtener estadisticas de leads:", error);
    return NextResponse.json(
      { error: "Error al obtener estadisticas de leads" },
      { status: 500 }
    );
  }
}
