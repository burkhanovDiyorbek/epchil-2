/** Shared look for the profile tab bars (master + customer): one row, scrolls on small screens. */
export const PROFILE_TABS_LIST =
  "mb-6 flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1.5 no-scrollbar dark:border-slate-800 dark:bg-slate-900/70";

export const PROFILE_TAB_TRIGGER =
  "min-w-fit shrink-0 grow justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-[#F97316] data-[state=active]:shadow-sm dark:text-slate-400 dark:hover:text-white dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-orange-400";

export const BETA_BADGE =
  "rounded-md bg-orange-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-orange-600 dark:bg-orange-950/50 dark:text-orange-400";

export const COUNT_BADGE =
  "rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300";

/** Removes the "[Beta]" suffix from a tab label (the badge is shown separately). */
export function cleanTabLabel(label: string): string {
  return label.replace(/\s*\[(beta|бета)\]/i, "").trim();
}
