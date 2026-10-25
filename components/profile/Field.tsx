"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, icon, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm">
        {icon} {label}
      </Label>
      {children}
      {error && <p className="text-red-500 text-xs font-bold bg-red-500/5 px-2 py-0.5 rounded-lg border border-red-500/10 w-fit">{error}</p>}
    </div>
  );
}
