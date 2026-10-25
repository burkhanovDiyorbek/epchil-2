"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, limitToLast, onSnapshot, orderBy, query } from "firebase/firestore";
import { Send, Loader2, MessageSquareText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, tr } from "@/components/language-provider";
import { categoryLabel } from "@/lib/categories";
import {
  chatIdFor, markChatRead, sendChatMessage, toDate, MAX_MESSAGE_LENGTH,
  type ChatMessage, type ChatParty,
} from "@/lib/chat";

export function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Who the signed-in user is talking to. */
export function useChatPeer(chat: ChatParty) {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const iAmMaster = user?.uid === chat.masterId;
  const name = (iAmMaster ? chat.customerName : chat.masterName) || tr(locale, "Foydalanuvchi", "Пользователь", "User");
  const subtitle = iAmMaster
    ? tr(locale, "Mijoz", "Клиент", "Client")
    : categoryLabel(chat.masterCategory, locale) || tr(locale, "Usta", "Мастер", "Master");
  return { name, subtitle };
}

/** Avatar + name block, shared by the dialog and the /messages page. */
export function ChatPeerBadge({ chat, title }: { chat: ChatParty; title: React.ReactNode }) {
  const { name, subtitle } = useChatPeer(chat);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A365D] to-blue-600 text-sm font-extrabold text-white shadow-md">
        {initialsOf(name)}
      </div>
      <div className="min-w-0">
        {title}
        <p className="truncate text-xs font-semibold text-[#F97316]">{subtitle}</p>
      </div>
    </div>
  );
}

/** Message list + composer for one thread (real-time). Remount with `key` per thread. */
export function ChatThread({ chat, active = true }: { chat: ChatParty; active?: boolean }) {
  const { user, profile } = useAuth();
  const { locale } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const uid = user?.uid ?? "";
  const chatId = chatIdFor(chat.customerId, chat.masterId);
  const myName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "Epchil";

  useEffect(() => {
    if (!active || !uid) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limitToLast(300));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setLoadFailed(false);
        setMessages(
          snap.docs.map((d) => {
            const data = d.data({ serverTimestamps: "estimate" });
            return { id: d.id, senderId: data.senderId, text: data.text, createdAt: toDate(data.createdAt) };
          })
        );
      },
      (err) => {
        console.error("Chat listener error:", err);
        setLoadFailed(true);
      }
    );
    return () => unsubscribe();
  }, [active, chatId, uid]);

  // Mark as read whenever something new arrives while the thread is visible.
  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (active && uid && lastId) markChatRead(chatId, uid);
  }, [active, chatId, uid, lastId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await sendChatMessage(chat, { uid, name: myName }, text);
      setText("");
    } catch (err) {
      console.error("Send message failed:", err);
      setError(
        tr(
          locale,
          "Xabar yuborilmadi. Internetni tekshirib, qayta urinib ko'ring.",
          "Не удалось отправить сообщение. Проверьте интернет и попробуйте снова.",
          "Message not sent. Check your connection and try again."
        )
      );
    } finally {
      setSending(false);
    }
  };

  const intlLocale = locale === "uz" ? "en-GB" : locale;
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" }), [intlLocale]);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long" }), [intlLocale]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50/40 p-4 dark:bg-slate-950">
        {loadFailed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
            <AlertCircle className="text-red-400" size={28} />
            <p className="max-w-xs">
              {tr(
                locale,
                "Suhbatni yuklab bo'lmadi. Firestore qoidalari yangilanganini tekshiring.",
                "Не удалось загрузить чат. Проверьте, что правила Firestore обновлены.",
                "Could not load the chat. Make sure the Firestore rules are up to date."
              )}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
              <MessageSquareText size={26} />
            </span>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {tr(locale, "Suhbatni boshlang", "Начните диалог", "Start the conversation")}
            </p>
            <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
              {tr(
                locale,
                "Muammoni yozing va manzilni aniqlashtiring. Javob kelganda bildirishnoma olasiz.",
                "Опишите проблему и уточните адрес. Вы получите уведомление, когда придёт ответ.",
                "Describe the problem and confirm the address. You'll be notified when a reply arrives."
              )}
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.senderId === uid;
            const prev = messages[i - 1];
            const showDay = m.createdAt && (!prev?.createdAt || dayKey(prev.createdAt) !== dayKey(m.createdAt));
            return (
              <div key={m.id}>
                {showDay && m.createdAt && (
                  <p className="my-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {dateFmt.format(m.createdAt)}
                  </p>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      mine
                        ? "rounded-br-md bg-[#F97316] text-white"
                        : "rounded-bl-md border border-slate-200/70 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={`mt-1 text-right text-[10px] font-semibold ${mine ? "text-white/75" : "text-slate-400"}`}>
                      {m.createdAt ? timeFmt.format(m.createdAt) : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        {error && (
          <p role="alert" className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={tr(locale, "Xabaringizni yozing...", "Напишите сообщение...", "Type your message...")}
            className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
          <Button
            type="submit"
            disabled={!text.trim() || sending}
            aria-label={tr(locale, "Yuborish", "Отправить", "Send")}
            className="h-12 w-12 shrink-0 rounded-2xl bg-[#F97316] p-0 text-white shadow-lg shadow-orange-500/20 hover:bg-[#EA580C]"
          >
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </div>
      </form>
    </div>
  );
}
