import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: unreadOnly ? { read: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message, link } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title y message son requeridos" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: { type, title, message, link: link ?? null },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error al crear notificacion:", error);
    return NextResponse.json(
      { error: "Error al crear notificacion" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al marcar notificaciones:", error);
    return NextResponse.json(
      { error: "Error al marcar notificaciones" },
      { status: 500 }
    );
  }
}
