import {
  addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc, type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendNotification } from "@/components/profile/notifications";

/** The two people in a thread. Chat id is deterministic: "<customerId>_<masterId>". */
export interface ChatParty {
  customerId: string;
  masterId: string;
  customerName: string;
  masterName: string;
  masterCategory?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date | null;
}

export interface ChatSummary extends ChatParty {
  id: string;
  lastMessage: string;
  lastSenderId: string;
  updatedAt: Date | null;
  lastRead: Record<string, Date | null>;
}

export const MAX_MESSAGE_LENGTH = 1000;

export const chatIdFor = (customerId: string, masterId: string) => `${customerId}_${masterId}`;

/** Firestore Timestamp (or pending server timestamp) -> Date. */
export function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return typeof value.toDate === "function" ? value.toDate() : null;
}

export function isUnread(chat: ChatSummary, uid: string): boolean {
  if (!chat.lastSenderId || chat.lastSenderId === uid) return false;
  const read = chat.lastRead[uid];
  if (!read || !chat.updatedAt) return true;
  return chat.updatedAt.getTime() > read.getTime();
}

/** Sends a message, creating the thread on first use and notifying the other person on a turn change. */
export async function sendChatMessage(
  party: ChatParty,
  sender: { uid: string; name: string },
  rawText: string
) {
  const text = rawText.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!text) return;

  const id = chatIdFor(party.customerId, party.masterId);
  const chatRef = doc(db, "chats", id);

  let previousSender: string | null = null;
  try {
    const snap = await getDoc(chatRef);
    if (snap.exists()) previousSender = (snap.data().lastSenderId as string) ?? null;
  } catch {
    /* thread does not exist yet */
  }

  // Thread first (the message rule reads it), then the message itself.
  await setDoc(
    chatRef,
    {
      participants: [party.customerId, party.masterId],
      customerId: party.customerId,
      masterId: party.masterId,
      customerName: party.customerName,
      masterName: party.masterName,
      masterCategory: party.masterCategory ?? "",
      lastMessage: text.slice(0, 140),
      lastSenderId: sender.uid,
      updatedAt: serverTimestamp(),
      lastRead: { [sender.uid]: serverTimestamp() },
    },
    { merge: true }
  );
  await addDoc(collection(chatRef, "messages"), {
    senderId: sender.uid,
    text,
    createdAt: serverTimestamp(),
  });

  if (previousSender !== sender.uid) {
    const recipient = sender.uid === party.customerId ? party.masterId : party.customerId;
    await sendNotification(recipient, sender.name || "Epchil", text.slice(0, 100), "", "message");
  }
}

export async function markChatRead(chatId: string, uid: string) {
  try {
    await updateDoc(doc(db, "chats", chatId), { [`lastRead.${uid}`]: serverTimestamp() });
  } catch {
    /* thread not created yet or offline: nothing to mark */
  }
}
