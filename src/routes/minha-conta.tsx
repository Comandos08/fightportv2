import { createFileRoute, Outlet, redirect, notFound } from "@tanstack/react-router";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { getCurrentRole } from "@/lib/role";

export const Route = createFileRoute("/minha-conta")({
  beforeLoad: async () => {
    const { userId, role } = await getCurrentRole();
    if (!userId) throw redirect({ to: "/cadastro" });
    if (role !== "athlete") throw notFound();
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
