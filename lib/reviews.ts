"use client";

import { useEffect, useState } from "react";
import {
  collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Ratings are never stored as a number someone can edit.
 * Every rating is a `reviews/<orderId>_<direction>` document that the rules only allow
 * the order's own customer/master to create after the order reached the right status.
 * The displayed average is always calculated from these documents.
 *
 *   c2m = customer reviews master (public)    m2c = master reviews customer (private to both + admin)
 */
export type ReviewDirection = "c2m" | "m2c";

export interface Review {
  id: string;
  orderId: string;
  fromId: string;
  toId: string;
  direction: ReviewDirection;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: Date | null;
  isDemo?: boolean;
}

export interface RatingSummary {
  /** null when nobody rated yet (show "New", never a fake 5.0) */
  average: number | null;
  count: number;
}

function toDate(v: Timestamp | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  return typeof v.toDate === "function" ? v.toDate() : null;
}

function fromDoc(id: string, data: Record<string, unknown>): Review {
  return {
    id,
    orderId: String(data.orderId ?? ""),
    fromId: String(data.fromId ?? ""),
    toId: String(data.toId ?? ""),
    direction: (data.direction as ReviewDirection) ?? "c2m",
    rating: Number(data.rating ?? 0),
    comment: String(data.comment ?? ""),
    authorName: String(data.authorName ?? ""),
    createdAt: toDate(data.createdAt as Timestamp | undefined),
    isDemo: !!data.isDemo,
  };
}

export function summarize(reviews: Pick<Review, "rating">[]): RatingSummary {
  if (reviews.length === 0) return { average: null, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

/** Writes a review. Call it AFTER the order status was updated (the rules read the order). */
export async function createReview(input: {
  orderId: string;
  fromId: string;
  toId: string;
  direction: ReviewDirection;
  rating: number;
  comment: string;
  authorName: string;
}) {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  await setDoc(doc(db, "reviews", `${input.orderId}_${input.direction}`), {
    orderId: input.orderId,
    fromId: input.fromId,
    toId: input.toId,
    direction: input.direction,
    rating,
    comment: input.comment.trim().slice(0, 600),
    authorName: input.authorName.slice(0, 80),
    createdAt: serverTimestamp(),
  });
}

/** Ratings of every master, calculated from public customer->master reviews. One read for the catalog. */
export async function fetchMasterRatings(): Promise<Map<string, RatingSummary>> {
  const snap = await getDocs(query(collection(db, "reviews"), where("direction", "==", "c2m")));
  const buckets = new Map<string, number[]>();
  snap.forEach((d) => {
    const r = fromDoc(d.id, d.data());
    buckets.set(r.toId, [...(buckets.get(r.toId) ?? []), r.rating]);
  });
  const out = new Map<string, RatingSummary>();
  buckets.forEach((ratings, id) => out.set(id, summarize(ratings.map((rating) => ({ rating })))));
  return out;
}

/** Live reviews received by `uid` in the given direction, newest first, with the summary. */
export function useReviews(uid: string | undefined, direction: ReviewDirection) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "reviews"), where("toId", "==", uid), where("direction", "==", direction));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => fromDoc(d.id, d.data()));
        list.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setReviews(list);
      },
      (err) => console.error("Reviews listener error:", err)
    );
    return () => unsubscribe();
  }, [uid, direction]);

  return { reviews: uid ? reviews : [], summary: summarize(uid ? reviews : []) };
}
