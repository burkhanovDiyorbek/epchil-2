"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  /** Tailwind classes for the icon tile, e.g. "bg-amber-100 text-amber-600 ..." */
  tone: string;
  hint?: string;
}

export function StatCard({ icon, label, value, tone, hint }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="flex items-center gap-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    </motion.div>
  );
}
