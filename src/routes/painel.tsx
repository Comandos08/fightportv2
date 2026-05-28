import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PanelLayout } from "@/components/panel/PanelLayout";

export const Route = createFileRoute("/painel")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/cadastro" });
    }
  },
  component: PanelLayoutRoute,
});

function PanelLayoutRoute() {
  return (
    <PanelLayout>
      <Outlet />
    </PanelLayout>
  );
}
