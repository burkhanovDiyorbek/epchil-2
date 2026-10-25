"use client";

import { Bolt, Bot, Mail, MapPin, Phone, Send, Instagram, Facebook, ShieldCheck, Sparkles, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage, pick } from "@/components/language-provider";

const copy = {
  uz: {
    about: "Usta chaqirish platformasi. Premium xizmat va zamonaviy texnologiyalar uyg'unligi.",
    contacts: "Aloqa",
    address: "Samarqand va Qashqadaryo, O'zbekiston",
    links: "Sahifalar",
    home: "Bosh sahifa",
    booking: "Usta chaqirish",
    profile: "Profil",
    social: "Ijtimoiy tarmoqlar",
    rights: "Barcha huquqlar himoyalangan.",
    badges: ["Tekshirilgan ustalar", "AI saralash", "24/7 xizmat"],
  },
  ru: {
    about: "Платформа вызова мастеров. Сочетание премиум-сервиса и современных технологий.",
    contacts: "Контакты",
    address: "Самарканд и Кашкадарья, Узбекистан",
    links: "Разделы",
    home: "Главная",
    booking: "Вызов мастера",
    profile: "Профиль",
    social: "Соцсети",
    rights: "Все права защищены.",
    badges: ["Проверенные мастера", "ИИ-подбор", "Работаем 24/7"],
  },
  en: {
    about: "A platform for calling home-service masters. Premium service meets modern technology.",
    contacts: "Contact",
    address: "Samarkand & Kashkadarya, Uzbekistan",
    links: "Pages",
    home: "Home",
    booking: "Book a master",
    profile: "Profile",
    social: "Social media",
    rights: "All rights reserved.",
    badges: ["Verified masters", "AI matching", "24/7 service"],
  },
};

const socials = [
  { name: "Telegram", icon: Send },
  { name: "Instagram", icon: Instagram },
  { name: "Facebook", icon: Facebook },
];

const badgeIcons = [ShieldCheck, Sparkles, Clock3];

export function Footer() {
  const { locale } = useLanguage();
  const t = pick(locale, copy);

  return (
    <footer className="relative overflow-hidden bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
      <div className="pattern-border" aria-hidden="true" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 relative">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white mb-5">
            <div className="bg-gradient-to-br from-[#F97316] to-orange-500 text-white p-1.5 rounded-xl shadow-lg shadow-orange-500/20">
              <Bolt size={20} />
            </div>
            Epchil
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">{t.about}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {t.badges.map((b, i) => {
              const Icon = badgeIcons[i];
              return (
                <li
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <Icon size={13} className="text-[#F97316]" /> {b}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Pages */}
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white mb-5">{t.links}</h5>
          <ul className="space-y-3 text-sm">
            {[
              { href: "/", label: t.home },
              { href: "/booking", label: t.booking },
              { href: "/profile", label: t.profile },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="group inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#F97316] transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-[#F97316] transition-colors" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white mb-5">{t.contacts}</h5>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <Phone size={14} />
              </span>
              +998 90 123 45 67
            </li>
            <li className="flex items-center gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Mail size={14} />
              </span>
              hello@epchil.uz
            </li>
            <li className="flex items-center gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <MapPin size={14} />
              </span>
              {t.address}
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white mb-5">{t.social}</h5>
          <div className="flex gap-3 mb-6">
            {socials.map(({ name, icon: Icon }) => (
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                key={name}
                href="#"
                aria-label={name}
                className="h-11 w-11 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-[#F97316] hover:text-[#F97316] transition-colors shadow-sm"
              >
                <Icon size={18} />
              </motion.a>
            ))}
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Bot size={14} className="text-[#F97316]" />
            Epchil AI Agent
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Epchil. {t.rights}
        </p>
      </div>
    </footer>
  );
}
