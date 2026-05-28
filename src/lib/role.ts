import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";

export type AppRole = "admin" | "school" | "athlete" | null;

export async function getCurrentRole(): Promise<{ userId: string | null; role: AppRole; isAdmin: boolean }> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;
  if (!userId) return { userId: null, role: null, isAdmin: false };
  try {
    const { data: row } = await db
      .from("user_roles")
      .select("role, is_admin")
      .eq("auth_id", userId)
      .maybeSingle();
    const r = row as { role?: string; is_admin?: boolean } | null;
    const isAdmin = !!r?.is_admin;
    const role = (isAdmin ? "admin" : (r?.role as AppRole)) ?? null;
    return { userId, role, isAdmin };
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
