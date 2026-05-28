import { createFileRoute, Outlet, redirect, notFound } from "@tanstack/react-router";
import { DashLayout } from "@/components/dash/DashLayout";
import { getCurrentRole } from "@/lib/role";

export const Route = createFileRoute("/dash")({
  beforeLoad: async () => {
    // SSR has no session — skip auth check; client handles it on hydration
    if (typeof window === 'undefined') return;
    const { userId, isAdmin } = await getCurrentRole();
    if (!userId) throw redirect({ to: "/cadastro" });
    if (!isAdmin) throw notFound();
  },
  component: DashRoute,
});

function DashRoute() {
  return <DashLayout><Outlet /></DashLayout>;
}
