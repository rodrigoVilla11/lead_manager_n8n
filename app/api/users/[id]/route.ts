import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = user.user_metadata?.role ?? "admin";
  if (role !== "admin") return null;
  return user;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.role) {
      const validRoles = ["admin", "worker", "client"];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: "Rol invalido" },
          { status: 400 }
        );
      }
      updateData.user_metadata = { role: body.role };
    }
    if (body.password) {
      updateData.password = body.password;
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      updateData
    );

    if (error) throw error;

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json(
        { error: "No podes eliminarte a vos mismo" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
