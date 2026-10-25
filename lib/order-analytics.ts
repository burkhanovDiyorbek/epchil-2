import type { Locale } from "@/components/language-provider";

export type Period = "weekly" | "monthly" | "yearly";

export interface PeriodStats {
  /** Sum of final prices of completed orders inside the window */
  amount: number;
  /** Completed orders inside the window */
  completed: number;
  /** Orders still waiting for the master's answer (all time) */
  pending: number;
  /** One value per bucket (UZS) */
  trends: number[];
  labels: string[];
}

interface OrderLike {
  status: string;
  createdAt?: unknown;
  finalPrice?: number;
  masterConfirmedPrice?: number;
  clientConfirmedPrice?: number;
}

const WEEKDAYS: Record<Locale, string[]> = {
  uz: ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const MONTHS: Record<Locale, string[]> = {
  uz: ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"],
  ru: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const v = value as { toDate?: () => Date; seconds?: number };
  if (typeof v.toDate === "function") return v.toDate();
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d;
}

function amountOf(o: OrderLike) {
  return o.finalPrice || o.masterConfirmedPrice || o.clientConfirmedPrice || 0;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Builds weekly (7 days), monthly (6 months) and yearly (6 quarters) figures from real orders. */
export function buildOrderStats(orders: OrderLike[], locale: Locale): Record<Period, PeriodStats> {
  const now = new Date();
  const pending = orders.filter((o) => o.status === "pending").length;
  const done = orders
    .filter((o) => o.status === "done")
    .map((o) => ({ date: toDate(o.createdAt), amount: amountOf(o) }))
    .filter((o): o is { date: Date; amount: number } => o.date !== null);

  const make = (
    bucketCount: number,
    bucketOf: (d: Date) => number, // 0 = oldest ... bucketCount-1 = current
    labels: string[]
  ): PeriodStats => {
    const trends = new Array(bucketCount).fill(0) as number[];
    let completed = 0;
    for (const o of done) {
      const i = bucketOf(o.date);
      if (i >= 0 && i < bucketCount) {
        trends[i] += o.amount;
        completed += 1;
      }
    }
    return { amount: trends.reduce((a, b) => a + b, 0), completed, pending, trends, labels };
  };

  // Weekly: last 7 days, oldest first
  const today = startOfDay(now);
  const dayLabels = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - k));
    return WEEKDAYS[locale][d.getDay()];
  });
  const weekly = make(7, (d) => 6 - Math.round((today.getTime() - startOfDay(d).getTime()) / 86400000), dayLabels);

  // Monthly: last 6 calendar months
  const monthLabels = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    return MONTHS[locale][d.getMonth()];
  });
  const monthly = make(
    6,
    (d) => 5 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())),
    monthLabels
  );

  // Yearly: last 6 quarters
  const nowQ = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
  const quarterLabels = Array.from({ length: 6 }, (_, k) => {
    const q = nowQ - (5 - k);
    return `Q${(q % 4) + 1} '${String(Math.floor(q / 4)).slice(-2)}`;
  });
  const yearly = make(6, (d) => 5 - (nowQ - (d.getFullYear() * 4 + Math.floor(d.getMonth() / 3))), quarterLabels);

  return { weekly, monthly, yearly };
}
