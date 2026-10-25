"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, type DocumentData, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Review } from "@/lib/reviews";
import type { AdminChat, AdminData, AdminMaster, AdminOrder, AdminUser } from "@/lib/admin-stats";

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const t = v as Timestamp;
  if (typeof t.toDate === "function") return t.toDate();
  const d = new Date(v as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export const mapUser = (id: string, d: DocumentData): AdminUser => ({
  id,
  role: d.role ?? null,
  name: str(d.name),
  email: str(d.email),
  phone: str(d.phone),
  region: str(d.region),
  blocked: !!d.blocked,
  isDemo: !!d.isDemo,
  createdAt: toDate(d.createdAt),
});

export const mapMaster = (id: string, d: DocumentData): AdminMaster => ({
  id,
  name: str(d.name) || `${str(d.firstName)} ${str(d.lastName)}`.trim(),
  category: str(d.category),
  region: str(d.region),
  district: str(d.district),
  phone: str(d.phone),
  basePrice: Number(d.basePrice ?? 0),
  isVerified: !!d.isVerified,
  isHidden: !!d.isHidden,
  isAvailable: d.isAvailable ?? true,
  isDemo: !!d.isDemo,
  createdAt: toDate(d.createdAt),
});

export const mapOrder = (id: string, d: DocumentData, regionOf: (masterId: string) => string): AdminOrder => ({
  id,
  status: str(d.status) || "pending",
  masterId: str(d.masterId),
  userId: str(d.userId),
  masterName: str(d.masterName),
  userName: str(d.userName) || str(d.phone),
  category: str(d.masterCategory),
  region: regionOf(str(d.masterId)),
  problem: str(d.problem),
  address: str(d.address),
  amount: Number(d.finalPrice ?? d.clientConfirmedPrice ?? d.masterConfirmedPrice ?? 0),
  isDemo: !!d.isDemo,
  createdAt: toDate(d.createdAt),
});

export const mapReview = (id: string, x: DocumentData): Review => ({
  id,
  orderId: str(x.orderId),
  fromId: str(x.fromId),
  toId: str(x.toId),
  direction: x.direction === "m2c" ? "m2c" : "c2m",
  rating: Number(x.rating ?? 0),
  comment: str(x.comment),
  authorName: str(x.authorName),
  createdAt: toDate(x.createdAt),
  isDemo: !!x.isDemo,
});

/** Builds AdminData from in-memory demo docs (dev preview only, nothing is read from Firestore). */
export function adminDataFromDocs(docs: { col: string; id: string; data: DocumentData }[]): AdminData {
  const by = (c: string) => docs.filter((d) => d.col === c);
  const masters = by("masters").map((d) => mapMaster(d.id, d.data));
  const regionByMaster = new Map(masters.map((m) => [m.id, m.region]));
  return {
    users: by("users").map((d) => mapUser(d.id, d.data)),
    masters,
    orders: by("orders").map((d) => mapOrder(d.id, d.data, (mid) => regionByMaster.get(mid) ?? "")),
    reviews: by("reviews").map((d) => mapReview(d.id, d.data)),
    chats: [],
  };
}

/** Live copy of every collection the admin dashboard needs. Admin-only (see firestore.rules). */
export function useAdminData(enabled: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [masters, setMasters] = useState<AdminMaster[]>([]);
  const [rawOrders, setRawOrders] = useState<{ id: string; d: DocumentData }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState({ users: false, masters: false, orders: false, reviews: false, chats: false });

  useEffect(() => {
    if (!enabled) return;
    const mark = (k: keyof typeof ready) => setReady((r) => ({ ...r, [k]: true }));
    const fail = (e: Error) => {
      console.error("Admin listener error:", e);
      setError(e.message);
    };
    const subs = [
      onSnapshot(collection(db, "users"), (s) => { setUsers(s.docs.map((d) => mapUser(d.id, d.data()))); mark("users"); }, fail),
      onSnapshot(collection(db, "masters"), (s) => { setMasters(s.docs.map((d) => mapMaster(d.id, d.data()))); mark("masters"); }, fail),
      onSnapshot(collection(db, "orders"), (s) => { setRawOrders(s.docs.map((d) => ({ id: d.id, d: d.data() }))); mark("orders"); }, fail),
      onSnapshot(
        collection(db, "reviews"),
        (s) => {
          setReviews(
            s.docs.map((d) => {
              const x = d.data();
              return {
                id: d.id,
                orderId: str(x.orderId),
                fromId: str(x.fromId),
                toId: str(x.toId),
                direction: x.direction === "m2c" ? "m2c" : "c2m",
                rating: Number(x.rating ?? 0),
                comment: str(x.comment),
                authorName: str(x.authorName),
                createdAt: toDate(x.createdAt),
                isDemo: !!x.isDemo,
              } as Review;
            })
          );
          mark("reviews");
        },
        fail
      ),
      onSnapshot(collection(db, "chats"), (s) => { setChats(s.docs.map((d) => ({ id: d.id, updatedAt: toDate(d.data().updatedAt), isDemo: !!d.data().isDemo }))); mark("chats"); }, fail),
    ];
    return () => subs.forEach((u) => u());
  }, [enabled]);

  const regionByMaster = new Map(masters.map((m) => [m.id, m.region]));
  const orders = rawOrders.map((o) => mapOrder(o.id, o.d, (mid) => regionByMaster.get(mid) ?? ""));
  const data: AdminData = { users, masters, orders, reviews, chats };
  const loading = enabled && !Object.values(ready).every(Boolean) && !error;
  return { data, loading, error };
}
