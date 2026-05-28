import { createFileRoute, Outlet, redirect, notFound } from "@tanstack/react-router";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { getCurrentRole } from "@/lib/role";

export const Route = createFileRoute("/painel")({
  beforeLoad: async () => {
    const { userId, role } = await getCurrentRole();
    if (!userId) throw redirect({ to: "/cadastro" });
    if (role !== "school") throw notFound();
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
