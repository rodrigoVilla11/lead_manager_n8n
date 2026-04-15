import { createClient } from "@/utils/supabase/server";
import type { UserRole } from "@/lib/roles";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    role: (user.user_metadata?.role as UserRole) ?? "admin",
  };
}
