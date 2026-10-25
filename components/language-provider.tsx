"use client";

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore, ReactNode } from "react";

export type Locale = "uz" | "ru" | "en";

export const LOCALES: Locale[] = ["uz", "ru", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

/** Speech-recognition BCP-47 tags per locale */
export const SPEECH_LANG: Record<Locale, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

/** Pick a string for the active locale. Falls back to Uzbek if English is missing. */
export function tr(locale: Locale, uz: string, ru: string, en?: string): string {
  if (locale === "ru") return ru;
  if (locale === "en") return en ?? uz;
  return uz;
}

/** Pick a value from a partial per-locale dictionary with a safe fallback. */
export function pick<T>(locale: Locale, dict: { uz: T; ru?: T; en?: T }): T {
  return (dict[locale] ?? dict.en ?? dict.uz) as T;
}

function isLocale(v: unknown): v is Locale {
  return v === "uz" || v === "ru" || v === "en";
}

/* ── Tiny external store so the locale can be read from localStorage / the
      browser without a setState-in-effect, and without hydration mismatches. ── */
const listeners = new Set<() => void>();

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem("locale");
    if (isLocale(saved)) return saved;
    const nav = (navigator.language || "uz").slice(0, 2).toLowerCase();
    if (isLocale(nav)) return nav;
  } catch {
    /* storage blocked: fall through to the default */
  }
  return "uz";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(subscribe, readLocale, () => "uz");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem("locale", next);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
