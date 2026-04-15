import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the caller is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const callerRole = user.user_metadata?.role ?? "admin";
    if (callerRole !== "admin") {
      return NextResponse.json(
        { error: "Solo administradores pueden cambiar roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId y role son requeridos" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "operator", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rol invalido" },
        { status: 400 }
      );
    }

    // Note: updating another user's metadata requires the service_role key.
    // For now, this only works for self-update via the publishable key.
    // To manage other users, you'd need a Supabase admin client.
    const { error } = await supabase.auth.updateUser({
      data: { role },
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al cambiar rol:", error);
    return NextResponse.json(
      { error: "Error al cambiar rol" },
      { status: 500 }
    );
  }
}
