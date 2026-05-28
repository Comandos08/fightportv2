import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";

export const Route = createFileRoute("/minha-conta")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/cadastro" });
    }
  },
  component: AthleteLayoutRoute,
});

function AthleteLayoutRoute() {
  return (
    <AthleteLayout>
      <Outlet />
    </AthleteLayout>
  );
}
