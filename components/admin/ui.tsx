"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useLanguage, tr } from "@/components/language-provider";

export const money = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} UZS`;

export function moneyShort(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mlrd`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} ming`;
  return String(Math.round(n));
}

export function formatDate(d: Date | null) {
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function Card({
  title, action, children, className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES: Record<string, string> = {
  orange: "bg-orange-100 text-[#F97316] dark:bg-orange-950/40",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  red: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
};

export function StatTile({
  icon, label, value, sub, tone = "orange",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="flex items-start gap-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${TONES[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-2xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        {sub && <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{sub}</p>}
      </div>
    </motion.div>
  );
}

const PILL: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
};

export function Pill({ tone = "slate", children }: { tone?: keyof typeof PILL; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${PILL[tone]}`}>
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<string, keyof typeof PILL> = {
  pending: "amber",
  accepted: "blue",
  completed_by_master: "purple",
  done: "green",
  cancelled: "red",
  reported: "orange",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  accepted: "#3B82F6",
  completed_by_master: "#8B5CF6",
  done: "#10B981",
  cancelled: "#EF4444",
  reported: "#F97316",
};

export function useStatusLabel() {
  const { locale } = useLanguage();
  return (s: string) =>
    ({
      pending: tr(locale, "Kutilmoqda", "Ожидает", "Pending"),
      accepted: tr(locale, "Qabul qilingan", "Принят", "Accepted"),
      completed_by_master: tr(locale, "Usta bitirdi", "Мастер завершил", "Finished by master"),
      done: tr(locale, "Bajarildi", "Выполнен", "Completed"),
      cancelled: tr(locale, "Bekor qilingan", "Отменён", "Cancelled"),
      reported: tr(locale, "Shikoyat", "Жалоба", "Reported"),
    } as Record<string, string>)[s] ?? s;
}

export function SearchBox({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      />
    </div>
  );
}

/** Filter chips (segmented control). */
export function Chips<T extends string>({
  value, onChange, options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
            value === o.value
              ? "bg-[#F97316] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Two-step button: first click arms it, second click confirms (no blocking browser dialogs). */
export function ConfirmButton({
  onConfirm, children, confirmLabel, tone = "slate", disabled,
}: {
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
  confirmLabel: string;
  tone?: "slate" | "red" | "green" | "orange";
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const base = "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all disabled:opacity-50";
  const idle: Record<string, string> = {
    slate: "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
    red: "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30",
    green: "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30",
    orange: "border border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/50 dark:hover:bg-orange-950/30",
  };
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={async () => {
        if (!armed) {
          setArmed(true);
          setTimeout(() => setArmed(false), 3500);
          return;
        }
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
      className={`${base} ${armed ? "bg-red-600 text-white shadow-md hover:bg-red-700" : idle[tone]}`}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 dark:border-slate-800">{text}</p>;
}
