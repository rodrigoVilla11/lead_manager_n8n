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

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role ?? "admin",
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return NextResponse.json(
      { error: "Error al listar usuarios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "email, password y role son requeridos" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "worker", "client"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rol invalido. Debe ser: admin, worker o client" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { role },
      email_confirm: true,
    });

    if (error) throw error;

    return NextResponse.json(
      {
        id: data.user.id,
        email: data.user.email,
        role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear usuario:", error);
    const message =
      error instanceof Error ? error.message : "Error al crear usuario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
