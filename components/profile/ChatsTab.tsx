"use client";

import { MessageSquareText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage, tr } from "@/components/language-provider";
import { categoryLabel } from "@/lib/categories";
import { initialsOf } from "@/components/chat/ChatThread";
import { isUnread, type ChatParty, type ChatSummary } from "@/lib/chat";

interface ChatsTabProps {
  uid: string;
  chats: ChatSummary[];
  loading: boolean;
  onOpen: (chat: ChatParty & { id: string }) => void;
  selectedId?: string;
}

/** Inbox list: all conversations of the signed-in user. */
export function ChatsTab({ uid, chats, loading, onOpen, selectedId }: ChatsTabProps) {
  const { locale } = useLanguage();
  const fmt = new Intl.DateTimeFormat(locale === "uz" ? "en-GB" : locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="animate-spin" size={26} />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="m-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/40">
        <MessageSquareText size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {tr(locale, "Hozircha suhbatlar yo'q", "Пока нет диалогов", "No conversations yet")}
        </p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
          {tr(
            locale,
            "Usta kartasidagi \"Chat\" tugmasi yoki buyurtma orqali yozishmani boshlang.",
            "Начните диалог кнопкой «Чат» на карточке мастера или из заказа.",
            "Start a chat with the \"Chat\" button on a master card or from an order."
          )}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1.5 p-2">
      {chats.map((c, i) => {
        const iAmMaster = c.masterId === uid;
        const name = (iAmMaster ? c.customerName : c.masterName) || tr(locale, "Foydalanuvchi", "Пользователь", "User");
        const unread = isUnread(c, uid);
        const selected = c.id === selectedId;
        return (
          <motion.li key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <button
              type="button"
              onClick={() => onOpen(c)}
              className={`flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all ${
                selected
                  ? "border-[#F97316]/40 bg-orange-50 dark:border-[#F97316]/40 dark:bg-orange-950/30"
                  : unread
                  ? "border-[#F97316]/20 bg-orange-50/50 hover:bg-orange-50 dark:border-[#F97316]/20 dark:bg-orange-950/10"
                  : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A365D] to-blue-600 text-sm font-extrabold text-white">
                {initialsOf(name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{name}</span>
                  <span className="shrink-0 text-[11px] font-semibold text-slate-400">{c.updatedAt ? fmt.format(c.updatedAt) : ""}</span>
                </span>
                <span className="block truncate text-[11px] font-bold text-[#F97316]">
                  {iAmMaster ? tr(locale, "Mijoz", "Клиент", "Client") : categoryLabel(c.masterCategory, locale)}
                </span>
                <span className={`mt-0.5 block truncate text-sm ${unread ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                  {c.lastSenderId === uid ? `${tr(locale, "Siz", "Вы", "You")}: ` : ""}
                  {c.lastMessage}
                </span>
              </span>
              {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#F97316]" aria-label="unread" />}
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
