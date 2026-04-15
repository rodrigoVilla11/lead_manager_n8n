import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, amount, date, method, notes, status } = body;

    if (!clientId || amount == null || !date) {
      return NextResponse.json(
        { error: "clientId, amount y date son requeridos" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: "El monto debe ser un numero positivo" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Fecha invalida" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const validStatuses = ["PAID", "PENDING", "OVERDUE", "CANCELLED"];
    const paymentStatus = validStatuses.includes(status) ? status : "PAID";

    const payment = await prisma.payment.create({
      data: {
        clientId,
        amount: parsedAmount,
        date: parsedDate,
        method: method || null,
        notes: notes || null,
        status: paymentStatus,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return NextResponse.json(
      { error: "Error al registrar el pago" },
      { status: 500 }
    );
  }
}
