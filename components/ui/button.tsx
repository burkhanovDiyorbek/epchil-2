"use client";

import * as React from "react";

type ButtonVariant = "default" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

function getVariantClasses(variant: ButtonVariant) {
  if (variant === "outline") {
    return "border border-[#1A365D] bg-transparent text-[#1A365D] hover:bg-[#1A365D]/10 dark:border-blue-200 dark:text-blue-100 dark:hover:bg-white/10";
  }

  if (variant === "ghost") {
    return "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";
  }

  return "bg-[#F97316] text-white hover:bg-[#ea620c]";
}

export function Button({
  className = "",
  variant = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 ${getVariantClasses(
        variant,
      )} ${className}`}
      {...props}
    />
  );
}
