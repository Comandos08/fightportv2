import { createFileRoute, Outlet, redirect, notFound } from "@tanstack/react-router";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { getCurrentRole } from "@/lib/role";

export const Route = createFileRoute("/painel")({
  beforeLoad: async () => {
    // SSR has no session — skip auth check; client handles it on hydration
    if (typeof window === 'undefined') return;
    const { userId, role } = await getCurrentRole();
    if (!userId) throw redirect({ to: "/cadastro" });
    // Only block users with an explicit non-school role.
    // null role means user_roles query failed or row not yet provisioned — allow through per spec fallback.
    if (role && role !== "school") throw notFound();
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
