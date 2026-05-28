import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashLayout } from "@/components/dash/DashLayout";

export const Route = createFileRoute("/dash")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/cadastro" });
  },
  component: DashRoute,
});

function DashRoute() {
  return <DashLayout><Outlet /></DashLayout>;
}
