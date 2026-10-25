import type { Review } from "@/lib/reviews";

export interface AdminUser {
  id: string;
  role: "customer" | "master" | null;
  name: string;
  email: string;
  phone: string;
  region: string;
  blocked: boolean;
  isDemo: boolean;
  createdAt: Date | null;
}

export interface AdminMaster {
  id: string;
  name: string;
  category: string;
  region: string;
  district: string;
  phone: string;
  basePrice: number;
  isVerified: boolean;
  isHidden: boolean;
  isAvailable: boolean;
  isDemo: boolean;
  createdAt: Date | null;
}

export interface AdminOrder {
  id: string;
  status: string;
  masterId: string;
  userId: string;
  masterName: string;
  userName: string;
  category: string;
  region: string;
  problem: string;
  address: string;
  amount: number;
  isDemo: boolean;
  createdAt: Date | null;
}

export interface AdminChat {
  id: string;
  updatedAt: Date | null;
  isDemo: boolean;
}

export interface AdminData {
  users: AdminUser[];
  masters: AdminMaster[];
  orders: AdminOrder[];
  reviews: Review[];
  chats: AdminChat[];
}

export const STATUS_ORDER = ["pending", "accepted", "completed_by_master", "done", "cancelled", "reported"] as const;

export interface Point {
  label: string;
  value: number;
}

export interface Stats {
  totals: {
    users: number;
    customers: number;
    masters: number;
    verifiedMasters: number;
    availableMasters: number;
    blocked: number;
    orders: number;
    done: number;
    active: number;
    cancelled: number;
    reported: number;
    gmv: number;
    avgOrder: number;
    completionRate: number; // done / finished-or-cancelled
    reviews: number;
    avgRating: number | null;
    chats: number;
    newUsers7d: number;
    newUsers30d: number;
    orders7d: number;
    gmv30d: number;
  };
  ordersPerDay: Point[];
  signupsPerDay: Point[];
  gmvPerWeek: Point[];
  byStatus: Point[];
  byCategory: Point[];
  byRegion: Point[];
  mastersByRegion: Point[];
  ratingDistribution: Point[];
  funnel: Point[];
  topMasters: { id: string; name: string; category: string; done: number; gmv: number; rating: number | null; reviews: number }[];
}

const DAY = 86_400_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtDay(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function countBy<T>(items: T[], key: (t: T) => string): Point[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = key(it) || "—";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function computeStats(data: AdminData, now: Date = new Date()): Stats {
  const { users, masters, orders, reviews, chats } = data;
  const today = startOfDay(now).getTime();

  const doneOrders = orders.filter((o) => o.status === "done");
  const gmv = doneOrders.reduce((s, o) => s + o.amount, 0);
  const finished = doneOrders.length + orders.filter((o) => o.status === "cancelled").length;
  const c2m = reviews.filter((r) => r.direction === "c2m");
  const avgRating = c2m.length ? Math.round((c2m.reduce((s, r) => s + r.rating, 0) / c2m.length) * 10) / 10 : null;

  const within = (d: Date | null, days: number) => !!d && now.getTime() - d.getTime() <= days * DAY;

  // Per-day series (30 days)
  const ordersPerDay: Point[] = [];
  const signupsPerDay: Point[] = [];
  for (let i = 29; i >= 0; i--) {
    const from = today - i * DAY;
    const to = from + DAY;
    const label = fmtDay(new Date(from));
    ordersPerDay.push({ label, value: orders.filter((o) => o.createdAt && o.createdAt.getTime() >= from && o.createdAt.getTime() < to).length });
    signupsPerDay.push({ label, value: users.filter((u) => u.createdAt && u.createdAt.getTime() >= from && u.createdAt.getTime() < to).length });
  }

  // GMV per week (8 weeks)
  const gmvPerWeek: Point[] = [];
  for (let w = 7; w >= 0; w--) {
    const from = today - (w * 7 + 6) * DAY;
    const to = today - (w * 7 - 1) * DAY;
    gmvPerWeek.push({
      label: fmtDay(new Date(from)),
      value: doneOrders.filter((o) => o.createdAt && o.createdAt.getTime() >= from && o.createdAt.getTime() < to).reduce((s, o) => s + o.amount, 0),
    });
  }

  const byStatus = STATUS_ORDER.map((s) => ({ label: s, value: orders.filter((o) => o.status === s).length }));

  // Rating distribution 1..5
  const ratingDistribution = [5, 4, 3, 2, 1].map((n) => ({ label: String(n), value: c2m.filter((r) => r.rating === n).length }));

  // Funnel (orders only, so every step is a subset of the previous one):
  // placed -> accepted -> finished by the master -> confirmed by the client -> reviewed
  const accepted = orders.filter((o) => ["accepted", "completed_by_master", "done"].includes(o.status)).length;
  const finishedByMaster = orders.filter((o) => ["completed_by_master", "done"].includes(o.status)).length;
  const funnel: Point[] = [
    { label: "orders", value: orders.length },
    { label: "accepted", value: accepted },
    { label: "finished", value: finishedByMaster },
    { label: "done", value: doneOrders.length },
    { label: "reviewed", value: Math.min(c2m.length, doneOrders.length) },
  ];
  // Top masters
  const reviewsByMaster = new Map<string, number[]>();
  c2m.forEach((r) => reviewsByMaster.set(r.toId, [...(reviewsByMaster.get(r.toId) ?? []), r.rating]));
  const topMasters = masters
    .map((m) => {
      const mine = doneOrders.filter((o) => o.masterId === m.id);
      const ratings = reviewsByMaster.get(m.id) ?? [];
      return {
        id: m.id,
        name: m.name,
        category: m.category,
        done: mine.length,
        gmv: mine.reduce((s, o) => s + o.amount, 0),
        rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
        reviews: ratings.length,
      };
    })
    .sort((a, b) => b.gmv - a.gmv || b.done - a.done)
    .slice(0, 8);

  return {
    totals: {
      users: users.length,
      customers: users.filter((u) => u.role === "customer").length,
      masters: masters.length,
      verifiedMasters: masters.filter((m) => m.isVerified).length,
      availableMasters: masters.filter((m) => m.isAvailable && !m.isHidden).length,
      blocked: users.filter((u) => u.blocked).length,
      orders: orders.length,
      done: doneOrders.length,
      active: orders.filter((o) => ["pending", "accepted", "completed_by_master"].includes(o.status)).length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      reported: orders.filter((o) => o.status === "reported").length,
      gmv,
      avgOrder: doneOrders.length ? Math.round(gmv / doneOrders.length) : 0,
      completionRate: finished ? Math.round((doneOrders.length / finished) * 100) : 0,
      reviews: c2m.length,
      avgRating,
      chats: chats.length,
      newUsers7d: users.filter((u) => within(u.createdAt, 7)).length,
      newUsers30d: users.filter((u) => within(u.createdAt, 30)).length,
      orders7d: orders.filter((o) => within(o.createdAt, 7)).length,
      gmv30d: doneOrders.filter((o) => within(o.createdAt, 30)).reduce((s, o) => s + o.amount, 0),
    },
    ordersPerDay,
    signupsPerDay,
    gmvPerWeek,
    byStatus,
    byCategory: countBy(orders, (o) => o.category),
    byRegion: countBy(orders, (o) => o.region),
    mastersByRegion: countBy(masters, (m) => m.region),
    ratingDistribution,
    funnel,
    topMasters,
  };
}
