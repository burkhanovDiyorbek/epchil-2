import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function sendNotification(
  recipientId: string,
  title: string,
  message: string,
  orderId: string,
  status: string
) {
  if (!recipientId) return;
  try {
    await addDoc(collection(db, "notifications"), {
      userId: recipientId,
      title,
      message,
      orderId,
      status,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to send Firestore notification:", err);
  }
}
