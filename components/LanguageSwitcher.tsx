"use client";

import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useLanguage, tr, LOCALES, LOCALE_LABELS, type Locale } from "@/components/language-provider";

/** Compact language picker: globe + code in the trigger, full names in the menu. */
export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger
        aria-label={tr(locale, "Til", "Язык", "Language")}
        className="h-10 w-auto min-w-[4.75rem] gap-1.5 rounded-xl px-2.5 sm:px-3 [&>span]:!flex [&>span]:items-center"
      >
        <span className="flex items-center gap-1.5">
          <Globe size={15} className="text-slate-400 group-data-[state=open]:text-[#F97316]" />
          <span className="text-sm font-bold">{locale.toUpperCase()}</span>
        </span>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[11rem]">
        {LOCALES.map((l) => (
          <SelectItem key={l} value={l} className="pr-9">
            <span className="flex items-center gap-3">
              <span className="w-6 text-xs font-extrabold tracking-wide text-slate-400">{l.toUpperCase()}</span>
              <span>{LOCALE_LABELS[l]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
