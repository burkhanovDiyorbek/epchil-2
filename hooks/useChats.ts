"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isUnread, toDate, type ChatSummary } from "@/lib/chat";

/** Live list of the user's chat threads, newest first, plus the unread count. */
export function useChats(uid: string | undefined) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          const lastRead: Record<string, Date | null> = {};
          for (const [k, v] of Object.entries(data.lastRead ?? {})) lastRead[k] = toDate(v as never);
          return {
            id: d.id,
            customerId: data.customerId,
            masterId: data.masterId,
            customerName: data.customerName ?? "",
            masterName: data.masterName ?? "",
            masterCategory: data.masterCategory ?? "",
            lastMessage: data.lastMessage ?? "",
            lastSenderId: data.lastSenderId ?? "",
            updatedAt: toDate(data.updatedAt),
            lastRead,
          } as ChatSummary;
        });
        // Sorted locally so no composite index is needed.
        list.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
        setChats(list);
        setLoading(false);
      },
      (err) => {
        console.error("Chats listener error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  const unreadCount = useMemo(() => (uid ? chats.filter((c) => isUnread(c, uid)).length : 0), [chats, uid]);

  return { chats: uid ? chats : [], unreadCount: uid ? unreadCount : 0, loading: uid ? loading : false };
}
