import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";

export type AppRole = "admin" | "school" | "athlete" | null;

export async function getCurrentRole(): Promise<{ userId: string | null; role: AppRole; isAdmin: boolean }> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;
  if (!userId) return { userId: null, role: null, isAdmin: false };
  try {
    // Step 1: get the primary role from user_roles
    const { data: roleRow } = await db
      .from("user_roles")
      .select("role")
      .eq("auth_id", userId)
      .maybeSingle();
    const role = ((roleRow as { role?: string } | null)?.role as AppRole) ?? null;

    // athlete and direct admin roles need no further check
    if (role === "athlete") return { userId, role: "athlete", isAdmin: false };
    if (role === "admin") return { userId, role: "admin", isAdmin: true };

    // school users: check schools.is_admin to decide if they're the platform admin
    if (role === "school") {
      const { data: school } = await db
        .from("schools")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();
      const isAdmin = !!(school as { is_admin?: boolean } | null)?.is_admin;
      return { userId, role: isAdmin ? "admin" : "school", isAdmin };
    }

    return { userId, role: null, isAdmin: false };
  } catch {
    return { userId, role: null, isAdmin: false };
  }
}

export function targetForRole(role: AppRole): string {
  if (role === "admin") return "/dash";
  if (role === "school") return "/painel/praticantes";
  if (role === "athlete") return "/minha-conta";
  return "/painel/praticantes";
}
