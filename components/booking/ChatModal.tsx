"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLanguage, tr } from "@/components/language-provider";
import { chatIdFor, type ChatParty } from "@/lib/chat";
import { ChatPeerBadge, ChatThread, useChatPeer } from "@/components/chat/ChatThread";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatParty | null;
}

/** Dialog wrapper around the real-time chat (used from master cards and order cards). */
export function ChatModal({ isOpen, onClose, chat }: ChatModalProps) {
  if (!chat) return null;
  return <ChatDialog key={chatIdFor(chat.customerId, chat.masterId)} isOpen={isOpen} onClose={onClose} chat={chat} />;
}

function ChatDialog({ isOpen, onClose, chat }: { isOpen: boolean; onClose: () => void; chat: ChatParty }) {
  const { locale } = useLanguage();
  const { name } = useChatPeer(chat);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[85dvh] max-h-[640px] flex-col gap-0 overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:max-w-lg">
        <DialogDescription className="sr-only">
          {tr(locale, `${name} bilan suhbat`, `Чат с ${name}`, `Chat with ${name}`)}
        </DialogDescription>
        <div className="border-b border-slate-100 bg-slate-50/70 p-4 pr-12 dark:border-slate-800 dark:bg-slate-900/50">
          <ChatPeerBadge
            chat={chat}
            title={<DialogTitle className="truncate text-base font-extrabold text-slate-900 dark:text-white">{name}</DialogTitle>}
          />
        </div>
        <ChatThread chat={chat} active={isOpen} />
      </DialogContent>
    </Dialog>
  );
}
