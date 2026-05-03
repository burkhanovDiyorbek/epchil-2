import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: DivProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/90 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return <div className={`mb-3 space-y-1 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: DivProps) {
  return (
    <h3
      className={`text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }: DivProps) {
  return (
    <p
      className={`text-sm text-slate-600 dark:text-slate-300 ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`text-sm ${className}`} {...props} />;
}
