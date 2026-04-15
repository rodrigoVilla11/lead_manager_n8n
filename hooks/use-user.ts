import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { UserRole } from "@/lib/roles";
import { getPermissions } from "@/lib/roles";

export function useUser() {
  const [id, setId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("client");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setId(user?.id ?? null);
      setEmail(user?.email ?? null);
      setRole((user?.user_metadata?.role as UserRole) ?? "admin");
      setLoading(false);
    });
  }, []);

  return {
    id,
    email,
    role,
    loading,
    permissions: getPermissions(role),
  };
}
