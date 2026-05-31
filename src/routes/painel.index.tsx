import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Topbar } from "@/components/Topbar";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { BELT_COLORS } from "@/lib/belts";
import { getBeltTailwindClasses } from "@/components/BeltBadge";
import { BeltBadge } from "@/components/BeltBadge";
import { formatDateBR, formatDateBRShort } from "@/lib/utils";
import { format, subMonths, startOfMonth } from "date-fns";

export const Route = createFileRoute("/painel/")({ component: DashboardPage });

function DashboardPage() {
  const t = useT();
  const { user } = useSession();
  const schoolId = user?.id;

  const { data } = useQuery({
    queryKey: ["dash", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const [creditsRes, peopleRes, achRes] = await Promise.all([
        db.from("credits").select("balance").eq("school_id", schoolId).maybeSingle(),
        db.from("person_schools").select("person_id, current_belt").eq("school_id", schoolId),
        db
          .from("achievements")
          .select("id, belt, achieved_at, person_id")
          .eq("school_id", schoolId)
          .order("achieved_at", { ascending: false })
          .limit(500),
      ]);
      return {
        balance: Number(creditsRes.data?.balance ?? 0),
        people: peopleRes.data ?? [],
        achievements: achRes.data ?? [],
      };
    },
  });

  const { data: schoolMeta } = useQuery({
    queryKey: ["school-meta", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db.from("schools").select("name,martial_art,city,state").eq("id", schoolId).maybeSingle();
      return res.data ?? null;
    },
  });

  const topbarSubtitle = [
    schoolMeta?.name,
    schoolMeta?.martial_art,
    [schoolMeta?.city, schoolMeta?.state].filter(Boolean).join(" — "),
  ].filter(Boolean).join(" · ");

  if (!data) return (
    <>
      <Topbar title={t("panel.nav.dashboard")} subtitle={topbarSubtitle} />
      <div style={{ padding: "20px 24px" }}>
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    </>
  );

  const beltDist = Object.entries(
    (data.people as any[]).reduce<Record<string, number>>((acc: Record<string, number>, p: any) => {
      const k = p.current_belt ?? "—";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = startOfMonth(subMonths(new Date(), 5 - i));
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM"), date: d };
  });
  const achPerMonth = months.map((m) => ({
    label: m.label,
    count: (data.achievements as any[]).filter((a: any) => (a.achieved_at ?? "").startsWith(m.key)).length,
  }));

  let cumulative = 0;
  const evo = months.map((m) => {
    const created = data.people.length; // approximation w/o created_at
    cumulative = created; // flat: schema doesn't expose join date here
    return { label: m.label, total: cumulative };
  });

  const lastGrad = data.achievements[0];

  return (
    <>
    <Topbar title={t("panel.nav.dashboard")} subtitle={topbarSubtitle} />
    <div className="space-y-6" style={{ padding: "20px 24px" }}>


      {data.balance === 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          {t("dash.credits.zero")}{" "}
          <Link to="/painel/creditos" className="underline font-medium">
            {t("dash.credits.buyMore")}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t("dash.kpi.practitioners")} value={data.people.length} />
        <Kpi label={t("dash.kpi.certificates")} value={data.achievements.length} />
        <Kpi
          label={t("dash.kpi.credits")}
          value={data.balance}
          footer={
            data.balance < 5 ? (
              <Link to="/painel/creditos" className="text-xs underline text-amber-600">
                {t("dash.credits.buyMore")}
              </Link>
            ) : null
          }
        />
        <Kpi
          label={t("dash.kpi.lastGrad")}
          value={
            lastGrad ? formatDateBRShort(lastGrad.achieved_at) : "—"
          }
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title={t("dash.charts.beltDist")}>
          {beltDist.length === 0 ? (
            <Empty />
          ) : (
            <div className="flex gap-4 items-start">
              <div className="h-48 flex-1 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={beltDist} dataKey="value" nameKey="name" outerRadius={70}>
                      {beltDist.map((d, i) => (
                        <Cell key={i} fill={BELT_COLORS[d.name] ?? "#cccccc"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-1.5 pt-2 min-w-0 shrink-0">
                {beltDist.map((d) => {
                  const { dot } = getBeltTailwindClasses(d.name);
                  return (
                    <li key={d.name} className="flex items-center gap-2 text-[11.5px] text-[#555555]">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <span className="font-medium text-[#0f0f0f]">{d.name}</span>
                      <span className="text-[#999999] tabular-nums">{d.value}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>

        <Card title={t("dash.charts.achMonth")}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={achPerMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title={t("dash.charts.evolution")}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evo}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title={t("dash.recent.title")}>
        {data.achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dash.recent.empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data.achievements as any[]).slice(0, 5).map((a: any) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <BeltBadge belt={a.belt} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {a.person_id?.slice(0, 8)}
                  </span>
                </div>
                <span className="text-muted-foreground tabular-nums">
                  {formatDateBR(a.achieved_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
    </>
  );
}

function Kpi({
  label,
  value,
  footer,
}: {
  label: string;
  value: string | number;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">—</p>;
}
