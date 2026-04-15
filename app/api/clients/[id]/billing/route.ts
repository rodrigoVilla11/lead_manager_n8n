import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Validate monthlyAmount
    if (body.monthlyAmount != null) {
      const amount = Number(body.monthlyAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json(
          { error: "El monto mensual debe ser un numero positivo" },
          { status: 400 }
        );
      }
    }

    // Validate date
    let nextPaymentDate: Date | null | undefined;
    if (body.nextPaymentDate === null) {
      nextPaymentDate = null;
    } else if (body.nextPaymentDate) {
      const parsed = new Date(body.nextPaymentDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Fecha de proximo pago invalida" },
          { status: 400 }
        );
      }
      nextPaymentDate = parsed;
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(body.monthlyAmount !== undefined && {
          monthlyAmount: body.monthlyAmount !== null ? Number(body.monthlyAmount) : null,
        }),
        ...(nextPaymentDate !== undefined && { nextPaymentDate }),
        ...(body.paymentMethod !== undefined && {
          paymentMethod: body.paymentMethod || null,
        }),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error al actualizar facturacion:", error);
    return NextResponse.json(
      { error: "Error al actualizar facturacion" },
      { status: 500 }
    );
  }
}
