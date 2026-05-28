import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashPageHeader } from "@/components/dash/DashCommon";

export const Route = createFileRoute("/dash/suporte")({
  component: SupportPage,
});

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  open: { bg: "#fde68a", fg: "#92400e" },
  awaiting_admin: { bg: "#fde68a", fg: "#92400e" },
  awaiting_school: { bg: "#bfdbfe", fg: "#1e40af" },
  resolved: { bg: "#bbf7d0", fg: "#166534" },
  closed: { bg: "#e5e7eb", fg: "#374151" },
};

function SupportPage() {
  const t = useT();
  const [tab, setTab] = useState("open");
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");

  const filterMap: Record<string, string | null> = {
    open: "open", awaiting: "awaiting_school", resolved: "resolved", all: null,
  };

  const loadTickets = async () => {
    try {
      const r = await db.rpc("admin_list_support_tickets", { p_status: filterMap[tab] });
      setTickets(Array.isArray(r.data) ? r.data : []);
    } catch { setTickets([]); }
  };

  useEffect(() => { loadTickets(); }, [tab]);

  useEffect(() => {
    const ch = supabase.channel("dash-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => {
        loadTickets();
        if (selected) loadMessages(selected.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selected]);

  const loadMessages = async (ticketId: string) => {
    const { data } = await db.from("support_messages").select("*").eq("ticket_id", ticketId).order("created_at");
    setMessages(Array.isArray(data) ? data : []);
    try { await db.rpc("mark_messages_read", { p_ticket_id: ticketId, p_reader: "admin" }); } catch { /* ignore */ }
  };

  const select = async (tk: any) => {
    setSelected(tk);
    loadMessages(tk.id);
  };

  const send = async () => {
    if (!selected || !reply.trim()) return;
    try {
      await db.from("support_messages").insert({ ticket_id: selected.id, author_type: "admin", body: reply });
      try {
        await db.from("notifications").insert({
          recipient_type: "school", school_id: selected.school_id, type: "ticket_reply",
          title: "Nova resposta no seu ticket", body: reply.slice(0, 140),
        });
      } catch { /* ignore */ }
      try {
        await supabase.functions.invoke("send-ticket-reply-email", {
          body: { ticket_id: selected.id, body: reply },
        });
      } catch { /* ignore */ }
      setReply(""); loadMessages(selected.id);
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  const resolve = async () => {
    if (!selected) return;
    try {
      await db.rpc("admin_resolve_ticket", { p_ticket_id: selected.id });
      toast.success("Ticket resolvido.");
      loadTickets(); setSelected({ ...selected, status: "resolved" });
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  return (
    <div>
      <DashPageHeader title={t("dash.sup.title")} />
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelected(null); }}>
        <TabsList>
          <TabsTrigger value="open">{t("dash.sup.tab.open")}</TabsTrigger>
          <TabsTrigger value="awaiting">{t("dash.sup.tab.awaiting")}</TabsTrigger>
          <TabsTrigger value="resolved">{t("dash.sup.tab.resolved")}</TabsTrigger>
          <TabsTrigger value="all">{t("dash.sup.tab.all")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid lg:grid-cols-[360px_1fr] gap-4 mt-4">
        <div className="border border-border rounded-lg bg-card divide-y divide-border max-h-[70vh] overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">{t("sup.list.empty")}</div>
          ) : tickets.map((tk) => {
            const c = STATUS_COLORS[tk.status] ?? STATUS_COLORS.open;
            return (
              <button key={tk.id} onClick={() => select(tk)}
                className={`w-full text-left p-3 hover:bg-muted/40 ${selected?.id === tk.id ? "bg-muted/60" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{tk.subject}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: c.bg, color: c.fg }}>
                    {t(`sup.status.${tk.status}`)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">{tk.school_name ?? ""} · {new Date(tk.updated_at ?? tk.created_at).toLocaleString("pt-BR")}</div>
              </button>
            );
          })}
        </div>

        <div className="border border-border rounded-lg bg-card flex flex-col min-h-[70vh]">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">{t("sup.thread.empty")}</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold">{selected.subject}</div>
                  <div className="text-xs text-muted-foreground">{selected.school_name ?? ""}</div>
                </div>
                {selected.status !== "resolved" && (
                  <Button size="sm" onClick={resolve}>{t("dash.sup.resolve")}</Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.author_type === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.author_type === "admin" ? "bg-[#0D0D0D] text-white" : "bg-muted"}`}>
                      <div>{m.body}</div>
                      <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString("pt-BR")}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-3 space-y-2">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("dash.sup.reply.ph")} rows={3} />
                <div className="flex justify-end">
                  <Button onClick={send} disabled={!reply.trim()}>{t("sup.thread.send")}</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
