"use client";

import { motion } from "framer-motion";
import type { Point } from "@/lib/admin-stats";

/** Vertical bars. `every` shows every Nth x-label to keep dense series readable. */
export function BarChart({
  data, height = 160, color = "#F97316", every = 1, format = (n: number) => String(n),
}: {
  data: Point[];
  height?: number;
  color?: string;
  every?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="group relative flex h-full flex-1 items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(d.value > 0 ? 4 : 1.5, (d.value / max) * 100)}%` }}
              transition={{ duration: 0.5, delay: i * 0.012 }}
              className="w-full rounded-t-md"
              style={{ background: d.value > 0 ? color : "rgba(148,163,184,0.35)" }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {d.label}: {format(d.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="relative mt-2 flex h-4 gap-1">
        {data.map((d, i) => (
          <span key={`${d.label}-l-${i}`} className="relative flex-1">
            {i % every === 0 && (
              <span className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-400">{d.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Donut built with a conic-gradient, with the total in the centre and a legend. */
export function Donut({
  segments, centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const stops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const from = (acc / total) * 100;
      acc += s.value;
      return `${s.color} ${from}% ${(acc / total) * 100}%`;
    });
  const bg = total ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(rgba(148,163,184,0.3) 0 100%)";
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: bg }}>
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{total}</span>
          <span className="text-[11px] font-semibold text-slate-400">{centerLabel}</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="truncate text-slate-600 dark:text-slate-300">{s.label}</span>
            <span className="ml-auto font-bold text-slate-900 dark:text-white">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal ranking bars. */
export function HBars({
  items, color = "#1A365D", limit = 7, format = (n: number) => String(n), empty,
}: {
  items: Point[];
  color?: string;
  limit?: number;
  format?: (n: number) => string;
  empty: string;
}) {
  const shown = items.slice(0, limit);
  const max = Math.max(1, ...shown.map((i) => i.value));
  if (shown.length === 0) return <p className="py-8 text-center text-sm text-slate-400">{empty}</p>;
  return (
    <ul className="space-y-3">
      {shown.map((it, i) => (
        <li key={it.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{it.label}</span>
            <span className="font-bold text-slate-900 dark:text-white">{format(it.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(it.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="h-full rounded-full"
              style={{ background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Conversion funnel (each step as a % of the first). */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const first = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm font-semibold text-slate-600 dark:text-slate-300">{s.label}</span>
          <div className="relative h-9 flex-1 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(3, (s.value / first) * 100)}%` }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="h-full rounded-xl bg-gradient-to-r from-[#1A365D] to-[#F97316]"
            />
            <span className="absolute inset-y-0 left-3 flex items-center text-xs font-extrabold text-white mix-blend-difference">
              {s.value} · {Math.round((s.value / first) * 100)}%
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
