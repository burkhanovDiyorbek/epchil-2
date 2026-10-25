"use client";

import { Star, BadgeCheck, MessageCircle, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BookingModal } from "./BookingModal";
import { ChatModal } from "./ChatModal";
import { useLanguage, pick } from "@/components/language-provider";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatParty } from "@/lib/chat";
import { motion } from "framer-motion";

export interface Master {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  category: string;
  services: string[];
  basePrice: number;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  region: string;
  district: string;
  isAvailable: boolean;
  isDemo?: boolean;
  isHidden?: boolean;
}

const dict = {
  uz: {
    reviews: "ta sharh",
    priceLabel: "Boshlang'ich narx",
    bookBtn: "Chaqirish",
    busyBtn: "Band",
    chatBtn: "Chat",
    verified: "Tekshirilgan",
    available: "Faol",
    busy: "Band",
    from: "dan",
  },
  ru: {
    reviews: "отзывов",
    priceLabel: "Начальная цена",
    bookBtn: "Вызвать",
    busyBtn: "Занят",
    chatBtn: "Чат",
    verified: "Проверен",
    available: "Активен",
    busy: "Занят",
    from: "от",
  },
  en: {
    reviews: "reviews",
    priceLabel: "Starting price",
    bookBtn: "Book",
    busyBtn: "Busy",
    chatBtn: "Chat",
    verified: "Verified",
    available: "Available",
    busy: "Busy",
    from: "from",
  },
};

const CATEGORY_LABELS: Record<string, { ru: string; en: string }> = {
  santexnik: { ru: "Сантехник", en: "Plumber" },
  elektrik: { ru: "Электрик", en: "Electrician" },
  kafelchi: { ru: "Плиточник", en: "Tiler" },
  romchi: { ru: "Оконщик", en: "Window fitter" },
  tozalovchi: { ru: "Уборка", en: "Cleaning" },
  duradgor: { ru: "Плотник", en: "Carpenter" },
  konditsioner: { ru: "Кондиционеры", en: "Air conditioning" },
  quruvchi: { ru: "Строитель", en: "Builder" },
};

const categoryColorStyles: Record<string, { badge: string; text: string; bg: string }> = {
  santexnik: {
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    text: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  elektrik: {
    badge: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    text: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  kafelchi: {
    badge: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
    text: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  romchi: {
    badge: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
    text: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  tozalovchi: {
    badge: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
    text: "text-green-500",
    bg: "bg-green-500/10",
  },
};

export function MasterCard({ master, aiProblem = "" }: { master: Master; aiProblem?: string }) {
  const { locale } = useLanguage();
  const t = pick(locale, dict);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, profile } = useAuth();
  // In production nobody can order from / chat with themselves; in dev it stays on for testing.
  const isSelf = (!!user && user.uid === master.id && process.env.NODE_ENV === "production") || !!master.isDemo;
  // Mount the heavy modals only after first use; keeps a long catalog light.
  const [bookingMounted, setBookingMounted] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const categoryKey = master.category.toLowerCase();
  const categoryText =
    locale === "uz" ? master.category.replace(/_/g, " ") : CATEGORY_LABELS[categoryKey]?.[locale] ?? master.category.replace(/_/g, " ");
  const fullName = `${master.firstName} ${master.lastName}`;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&length=2`;

  const catStyle = categoryColorStyles[master.category.toLowerCase()] || {
    badge: "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400",
    text: "text-slate-500",
    bg: "bg-slate-500/10",
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-[2.2rem] p-5 shadow-sm hover:shadow-2xl hover:shadow-[#F97316]/5 dark:hover:shadow-orange-500/5 transition-all duration-300 flex flex-col h-full group relative overflow-hidden"
    >
      {/* Dynamic Background Hover Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#F97316]/5 via-transparent to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-700" />

      {/* 1. Header: Avatar & Main Profile Details */}
      <div className="flex items-start gap-3.5 mb-4 relative z-10">

        {/* Modern Avatar with Glow and Availability dot */}
        <div className="relative shrink-0">
          <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-950 group-hover:border-[#F97316]/40 transition-colors duration-500 shadow-md">
            <img src={avatarUrl} alt={fullName} width={56} height={56} loading="lazy" decoding="async" className="object-cover w-full h-full rounded-full" />
          </div>
          {/* Availability Dot Pulsing */}
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-950 shadow-md">
            <span className={`relative flex h-2 w-2 rounded-full ${master.isAvailable ? "bg-green-500" : "bg-red-500"}`}>
              {master.isAvailable && (
                <span className="absolute -inset-1 animate-ping rounded-full bg-green-400 opacity-75"></span>
              )}
            </span>
          </div>
        </div>

        {/* Name and Professional Categories */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
              {fullName}
            </h3>
            {master.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20 shadow-sm">
                <BadgeCheck size={10} className="fill-blue-500 text-white dark:text-slate-950 shrink-0" />
                {t.verified}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1">
            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border capitalize tracking-wide ${catStyle.badge}`}>
              <Sparkles size={10} className="mr-1 shrink-0 my-auto" />
              {categoryText}
            </span>
          </div>

          <div className="flex items-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold gap-0.5">
            <MapPin size={12} className="text-[#F97316] shrink-0" />
            <span className="truncate">{master.region}, {master.district}</span>
          </div>
        </div>
      </div>

      {/* 2. Service tags listing */}
      <div className="mb-4 relative z-10">
        <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto no-scrollbar">
          {master.services.map((svc) => (
            <span
              key={svc}
              className="text-[10px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-xl inline-block whitespace-nowrap"
            >
              {svc}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Rating & Reviews Statistics badge */}
      <div className="flex flex-wrap gap-2 mb-5 relative z-10">
        <div className="flex items-center gap-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-extrabold border border-yellow-500/20 shadow-sm">
          <Star size={12} fill="currentColor" className="shrink-0" />
          <span>
            {master.reviewsCount > 0
              ? master.rating.toFixed(1)
              : locale === "uz" ? "Yangi" : locale === "ru" ? "Новый" : "New"}
          </span>
        </div>
        {master.isDemo && (
          <div className="flex items-center rounded-xl border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-purple-600 dark:text-purple-400 sm:text-xs">
            Demo
          </div>
        )}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-350 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold border border-slate-200/30 dark:border-slate-800/30 shadow-sm">
          <MessageCircle size={12} className="shrink-0 text-blue-500" />
          <span>{master.reviewsCount} {t.reviews}</span>
        </div>
      </div>

      {/* 4. Footer Pricing & Book / Chat buttons - Placed vertically to avoid squeezing! */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-4 relative z-10">

        {/* Full width pricing row */}
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            {t.priceLabel}
          </span>
          <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
            {master.basePrice.toLocaleString()} UZS
          </span>
        </div>

        {/* Symmetrical 2-column buttons grid spanning 100% width */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
            <Button
              variant="outline"
              disabled={isSelf}
              onClick={() => {
                if (!user) {
                  window.dispatchEvent(new Event("epchil:open-auth"));
                  return;
                }
                setChatMounted(true);
                setIsChatOpen(true);
              }}
              className="w-full h-11 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-350 rounded-2xl text-xs font-bold transition-all"
            >
              {t.chatBtn}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: master.isAvailable ? 1.02 : 1 }} whileTap={{ scale: master.isAvailable ? 0.98 : 1 }} className="w-full">
            <Button
              disabled={!master.isAvailable || isSelf}
              onClick={() => { setBookingMounted(true); setIsModalOpen(true); }}
              className={`w-full h-11 text-xs font-extrabold rounded-2xl transition-all shadow-md ${
                master.isAvailable
                  ? "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-orange-500/10 hover:shadow-orange-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/20 dark:border-slate-700/20 shadow-none cursor-not-allowed"
              }`}
            >
              {master.isAvailable ? t.bookBtn : t.busyBtn}
            </Button>
          </motion.div>
        </div>
      </div>

      {bookingMounted && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          master={master}
          defaultProblem={aiProblem}
        />
      )}

      {chatMounted && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          chat={
            user
              ? {
                  customerId: user.uid,
                  masterId: master.id,
                  customerName: profile?.name || user.displayName || user.email?.split("@")[0] || "",
                  masterName: fullName,
                  masterCategory: master.category,
                } satisfies ChatParty
              : null
          }
        />
      )}
    </motion.div>
  );
}
