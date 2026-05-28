import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Filter = "all" | "open" | "resolved";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  open: { bg: "#fde68a", fg: "#92400e" },
  awaiting_admin: { bg: "#fde68a", fg: "#92400e" },
  awaiting_school: { bg: "#bfdbfe", fg: "#1e40af" },
  resolved: { bg: "#bbf7d0", fg: "#166534" },
  closed: { bg: "#e5e7eb", fg: "#374151" },
};

export const Route = createFileRoute("/painel/suporte")({ component: SupportPage });

function SupportPage() {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useSession();
  const schoolId = user?.id;
  const [filter, setFilter] = useState<Filter>("all");
  const [openNew, setOpenNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db
        .from("support_tickets")
        .select("*")
        .eq("school_id", schoolId)
        .order("updated_at", { ascending: false });
      return res.data ?? [];
    },
  });

  useEffect(() => {
    if (!schoolId) return;
    const ch = supabase
      .channel("school-support")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        () => {
          qc.invalidateQueries({ queryKey: ["tickets", schoolId] });
          if (selectedId) qc.invalidateQueries({ queryKey: ["thread", selectedId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [schoolId, qc, selectedId]);

  const filtered = useMemo(
    () =>
      tickets.filter((t: any) => {
        if (filter === "open") return !["resolved", "closed"].includes(t.status);
        if (filter === "resolved") return ["resolved", "closed"].includes(t.status);
        return true;
      }),
    [tickets, filter],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("sup.title")}</h1>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("sup.filter.all")}</SelectItem>
              <SelectItem value="open">{t("sup.filter.open")}</SelectItem>
              <SelectItem value="resolved">{t("sup.filter.resolved")}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setOpenNew(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("sup.new")}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${selectedId ? "hidden md:block" : ""} rounded-lg border border-border bg-card overflow-hidden`}>
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("sup.list.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((tk: any) => {
                const c = STATUS_COLORS[tk.status] ?? STATUS_COLORS.open;
                return (
                  <li key={tk.id}>
                    <button
                      className={`w-full text-left p-4 hover:bg-muted/40 ${selectedId === tk.id ? "bg-muted/60" : ""}`}
                      onClick={() => setSelectedId(tk.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${tk.unread_school ? "font-bold" : "font-medium"}`}>
                          {tk.subject}
                        </span>
                        {tk.unread_school > 0 && (
                          <span className="bg-[#dc2626] text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 inline-flex items-center justify-center">
                            {tk.unread_school}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: c.bg, color: c.fg }}
                        >
                          {t(`sup.status.${tk.status}`)}
                        </span>
                        <span>· {tk.category}</span>
                        <span>· {format(new Date(tk.updated_at ?? tk.created_at), "dd/MM/yy")}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={`${selectedId ? "" : "hidden md:block"}`}>
          {!selectedId ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              {t("sup.thread.empty")}
            </div>
          ) : (
            <Thread ticketId={selectedId} onBack={() => setSelectedId(null)} />
          )}
        </div>
      </div>

      <NewTicketDialog open={openNew} onOpenChange={setOpenNew} />
    </div>
  );
}

function Thread({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useSession();
  const [reply, setReply] = useState("");

  const { data: messages = [] } = useQuery({
    queryKey: ["thread", ticketId],
    queryFn: async () => {
      const res = await db
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      // mark as read
      await db.from("support_tickets").update({ unread_school: 0 }).eq("id", ticketId);
      return res.data ?? [];
    },
  });

  const send = async () => {
    if (!reply.trim()) return;
    const res = await db.from("support_messages").insert({
      ticket_id: ticketId,
      sender_id: user?.id,
      sender_role: "school",
      body: reply.trim(),
    });
    if (res.error) return toast.error(res.error.message);
    await db.from("support_tickets").update({ status: "awaiting_admin", updated_at: new Date().toISOString() }).eq("id", ticketId);
    setReply("");
    qc.invalidateQueries({ queryKey: ["thread", ticketId] });
    qc.invalidateQueries({ queryKey: ["tickets"] });
  };

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col h-[600px]">
      <div className="md:hidden p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m: any) => {
          const mine = m.sender_role === "school";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-[#0D0D0D] text-white" : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-muted-foreground"}`}>
                  {format(new Date(m.created_at), "dd/MM HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <Textarea
          rows={2}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={t("sup.thread.reply")}
          className="flex-1 resize-none"
        />
        <Button onClick={send}>{t("sup.thread.send")}</Button>
      </div>
    </div>
  );
}

function NewTicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useSession();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("duvida");
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!subject.trim() || !message.trim()) return toast.error(t("common.required"));
    const tk = await db
      .from("support_tickets")
      .insert({
        school_id: user?.id,
        subject: subject.trim(),
        category,
        status: "awaiting_admin",
        unread_admin: 1,
      })
      .select("id")
      .single();
    if (tk.error) return toast.error(tk.error.message);
    await db.from("support_messages").insert({
      ticket_id: tk.data.id,
      sender_id: user?.id,
      sender_role: "school",
      body: message.trim(),
    });
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: "contato@fightport.pro",
          subject: `[Suporte] ${subject}`,
          html: `<p>${message}</p>`,
        },
      });
    } catch {
      // optional
    }
    toast.success("Ticket criado.");
    setSubject("");
    setMessage("");
    setCategory("duvida");
    onOpenChange(false);
    qc.invalidateQueries({ queryKey: ["tickets"] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("sup.new")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("sup.modal.subject")}</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label>{t("sup.modal.category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">{t("sup.cat.bug")}</SelectItem>
                <SelectItem value="duvida">{t("sup.cat.duvida")}</SelectItem>
                <SelectItem value="creditos">{t("sup.cat.creditos")}</SelectItem>
                <SelectItem value="cadastro">{t("sup.cat.cadastro")}</SelectItem>
                <SelectItem value="outro">{t("sup.cat.outro")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("sup.modal.message")}</Label>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={submit}>{t("sup.modal.create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
