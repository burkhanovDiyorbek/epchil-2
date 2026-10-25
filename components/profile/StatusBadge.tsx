"use client";

import { tr, type Locale } from "@/components/language-provider";

interface StatusBadgeProps {
  status: string;
  locale: string;
}

export function StatusBadge({ status, locale: rawLocale }: StatusBadgeProps) {
  const locale = rawLocale as Locale;
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: tr(locale, "Kutilmoqda", "Ожидает", "Pending"),
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/45 dark:text-yellow-400 border border-yellow-500/15"
    },
    accepted: {
      label: tr(locale, "Qabul qilindi", "Принят", "Accepted"),
      className: "bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-400 border border-blue-500/15"
    },
    done: {
      label: tr(locale, "Bajarildi", "Выполнен", "Completed"),
      className: "bg-green-100 text-green-700 dark:bg-green-950/45 dark:text-green-400 border border-green-500/15"
    },
    cancelled: {
      label: tr(locale, "Bekor qilindi", "Отменен", "Cancelled"),
      className: "bg-red-100 text-red-700 dark:bg-red-950/45 dark:text-red-400 border border-red-500/15"
    },
    reported: {
      label: tr(locale, "Shikoyat ostida", "Под жалобой", "Under review"),
      className: "bg-orange-100 text-orange-700 dark:bg-orange-950/45 dark:text-orange-400 border border-orange-500/15"
    }
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${s.className}`}>
      {s.label}
    </span>
  );
}
