"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquareText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, tr } from "@/components/language-provider";
import { useChats } from "@/hooks/useChats";
import { ChatsTab } from "@/components/profile/ChatsTab";
import { ChatPeerBadge, ChatThread, useChatPeer } from "@/components/chat/ChatThread";
import { chatIdFor, type ChatParty } from "@/lib/chat";

function ThreadHeader({ chat, onBack }: { chat: ChatParty; onBack: () => void }) {
  const { locale } = useLanguage();
  const { name } = useChatPeer(chat);
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50 sm:p-4">
      <button
        type="button"
        onClick={onBack}
        aria-label={tr(locale, "Orqaga", "Назад", "Back")}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
      >
        <ArrowLeft size={20} />
      </button>
      <ChatPeerBadge chat={chat} title={<h2 className="truncate text-base font-extrabold text-slate-900 dark:text-white">{name}</h2>} />
    </div>
  );
}

function MessagesInner() {
  const { user, profile, loading } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const { chats, loading: chatsLoading } = useChats(user?.uid);
  const [selectedId, setSelectedId] = useState<string | null>(params?.get("c") ?? null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
    if (!loading && user && !profile?.role) router.replace("/onboarding");
  }, [loading, user, profile, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <Loader2 className="animate-spin text-[#F97316]" size={36} />
      </div>
    );
  }

  const selected = chats.find((c) => c.id === selectedId) ?? null;
  const select = (c: ChatParty) => {
    const id = chatIdFor(c.customerId, c.masterId);
    setSelectedId(id);
    router.replace(`/messages?c=${id}`, { scroll: false });
  };
  const back = () => {
    setSelectedId(null);
    router.replace("/messages", { scroll: false });
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-[#F8FAFC] dark:bg-slate-950">
      <div className="pattern-star mask-fade pointer-events-none absolute inset-x-0 top-0 h-[360px] opacity-50" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 lg:py-8">
        <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {tr(locale, "Xabarlar", "Сообщения", "Messages")}
        </h1>

        <div className="flex h-[calc(100dvh-220px)] min-h-[480px] overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Inbox */}
          <aside className={`${selected ? "hidden md:block" : "block"} w-full shrink-0 overflow-y-auto border-slate-100 dark:border-slate-800 md:w-[340px] md:border-r`}>
            <ChatsTab
              uid={user.uid}
              chats={chats}
              loading={chatsLoading}
              selectedId={selected?.id}
              onOpen={select}
            />
          </aside>

          {/* Conversation */}
          <section className={`${selected ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
            {selected ? (
              <>
                <ThreadHeader chat={selected} onBack={back} />
                <ChatThread key={selected.id} chat={selected} />
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F97316]/10 text-[#F97316]">
                  <MessageSquareText size={30} />
                </span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {tr(locale, "Suhbatni tanlang", "Выберите диалог", "Select a conversation")}
                </p>
                <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
                  {tr(
                    locale,
                    "Chap tomondagi ro'yxatdan mijoz yoki ustani tanlab, javob yozing.",
                    "Выберите клиента или мастера в списке слева и ответьте.",
                    "Pick a client or master from the list on the left and reply."
                  )}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-32">
          <Loader2 className="animate-spin text-[#F97316]" size={36} />
        </div>
      }
    >
      <MessagesInner />
    </Suspense>
  );
}
