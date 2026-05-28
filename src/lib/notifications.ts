import { db } from "./db";

export type NotificationType =
  | "new_school"
  | "payment_approved"
  | "new_ticket"
  | "ticket_reply_admin"
  | "ticket_reply_school"
  | "ticket_resolved"
  | "courtesy_credits"
  | "suspended"
  | "reactivated"
  | "graduation_registered";

export interface NotifyArgs {
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export async function notify(args: NotifyArgs) {
  return db.from("notifications").insert({
    user_id: args.user_id,
    type: args.type,
    title: args.title,
    body: args.body ?? null,
    link: args.link ?? null,
    read_at: null,
  });
}

export async function listMyNotifications(userId: string, limit = 20) {
  return db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

export async function markAllRead(userId: string) {
  return db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
