"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, tr } from "@/components/language-provider";
import {
  Star, Package, CheckCircle2, Clock, BadgeCheck, AlertCircle, Info, Phone, Mail,
  MapPin, Wrench, Sparkles, X,
} from "lucide-react";
import { categoryLabel } from "@/lib/categories";
import { useReviews } from "@/lib/reviews";

// ─── Modular components ─────────────────────────────────────────────────────
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { StatCard } from "@/components/profile/StatCard";
import { MasterProfile } from "@/components/profile/MasterProfile";
import { CustomerProfile } from "@/components/profile/CustomerProfile";
import locales from "@/components/profile/locales.json";

type OrderStatusCounts = { total: number; done: number; active: number; cancelled: number };

const ACTIVE_STATUSES = ["pending", "accepted", "completed_by_master"];

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();
  const t = (locales as Record<string, typeof locales.uz>)[locale] || locales.uz;

  // Real rating, calculated from reviews (customers rate masters, masters rate customers).
  const { summary: ratingSummary } = useReviews(user?.uid, profile?.role === "master" ? "c2m" : "m2c");
  const [counts, setCounts] = useState<OrderStatusCounts>({ total: 0, done: 0, active: 0, cancelled: 0 });

  // Floating toast overlay state
  const [toastMsg, setToastMsg] = useState<{ title: string; desc?: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" | "info" = "info") => {
    setToastMsg({ title, desc, type });
    if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/");
    if (!loading && user && !profile?.role) router.replace("/onboarding");
  }, [user, profile, loading, router]);

  // Real order counts for the stat cards (no placeholder numbers).
  useEffect(() => {
    if (!user || !profile?.role) return;
    const field = profile.role === "master" ? "masterId" : "userId";
    const unsubscribe = onSnapshot(
      query(collection(db, "orders"), where(field, "==", user.uid)),
      (snap) => {
        const statuses = snap.docs.map((d) => String(d.data().status || "pending"));
        setCounts({
          total: statuses.length,
          done: statuses.filter((s) => s === "done").length,
          active: statuses.filter((s) => ACTIVE_STATUSES.includes(s)).length,
          cancelled: statuses.filter((s) => s === "cancelled").length,
        });
      },
      () => {
        /* permission or network: keep zeros */
      }
    );
    return () => unsubscribe();
  }, [user, profile?.role]);

  // Profile completeness (drives the progress meter in the side card).
  const completeness = useMemo(() => {
    if (!profile) return { pct: 0, missing: 0 };
    const p = profile as unknown as Record<string, unknown> & { services?: string[] };
    const checks =
      profile.role === "master"
        ? [p.name, p.phone, p.category, p.services?.length, p.basePrice, p.region, p.district, p.bio, p.telegram || p.instagram || p.website, p.lat]
        : [p.name, p.phone, p.region, p.district, p.bio, p.lat];
    const done = checks.filter(Boolean).length;
    return { pct: Math.round((done / checks.length) * 100), missing: checks.length - done };
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 px-4 py-12 flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const isMaster = profile.role === "master";
  const displayName = profile.name || user.email?.split("@")[0] || tr(locale, "Foydalanuvchi", "Пользователь", "User");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const rating = ratingSummary.average !== null ? ratingSummary.average.toFixed(1) : "—";
  const location = [profile.region, profile.district].filter(Boolean).join(", ");
  const roleLabel = isMaster ? t.masterRole : t.customerRole;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F8FAFC] transition-colors duration-300 dark:bg-slate-950">
      <div className="pattern-star mask-fade pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 top-64 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:items-start lg:py-10">
        {/* ═════════ SIDE CARD ═════════ */}
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24"
        >
          {/* Cover */}
          <div className={`relative h-28 ${isMaster ? "bg-gradient-to-br from-[#1A365D] via-[#16294a] to-[#0F1F3D]" : "bg-gradient-to-br from-[#F97316] via-orange-500 to-amber-500"}`}>
            <div className="pattern-star absolute inset-0 opacity-60 mix-blend-overlay" aria-hidden="true" />
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-12 flex items-end justify-between">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white text-3xl font-extrabold text-white shadow-xl dark:border-slate-900 ${
                    isMaster ? "bg-gradient-to-br from-[#1A365D] to-blue-600" : "bg-gradient-to-br from-[#F97316] to-orange-600"
                  }`}
                >
                  {initials || "U"}
                </div>
                {isMaster && profile.isVerified && (
                  <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white p-0.5 dark:bg-slate-900">
                    <BadgeCheck size={22} className="fill-blue-500 text-white" />
                  </span>
                )}
              </motion.div>

              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {isMaster ? <Wrench size={12} /> : <Sparkles size={12} />}
                {roleLabel}
              </span>
            </div>

            <h1 className="mt-4 truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{displayName}</h1>
            {isMaster && profile.category && (
              <p className="mt-0.5 text-sm font-semibold text-[#F97316]">{categoryLabel(profile.category, locale)}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Star size={12} className="fill-current" /> {rating}
              </span>
              {isMaster && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                    profile.isVerified
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <BadgeCheck size={12} />
                  {profile.isVerified
                    ? tr(locale, "Tekshirilgan", "Проверен", "Verified")
                    : tr(locale, "Tekshiruvda", "На проверке", "Pending verification")}
                </span>
              )}
            </div>

            {/* Contact */}
            <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              {profile.phone && (
                <li className="flex items-center gap-3">
                  <Phone size={15} className="shrink-0 text-slate-400" />
                  <span className="truncate">{profile.phone}</span>
                </li>
              )}
              {user.email && (
                <li className="flex items-center gap-3">
                  <Mail size={15} className="shrink-0 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </li>
              )}
              {location && (
                <li className="flex items-center gap-3">
                  <MapPin size={15} className="shrink-0 text-slate-400" />
                  <span className="break-words">{location}</span>
                </li>
              )}
            </ul>

            {/* Services */}
            {isMaster && profile.services && profile.services.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">{t.services.split(" (")[0]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.services.slice(0, 8).map((s) => (
                    <span key={s} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Completeness */}
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">{tr(locale, "Profil to'liqligi", "Заполненность профиля", "Profile completeness")}</span>
                <span className="text-[#F97316]">{completeness.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#F97316] to-amber-400"
                />
              </div>
              <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {completeness.missing === 0
                  ? tr(locale, "Ajoyib, profil to'liq to'ldirilgan!", "Отлично, профиль заполнен полностью!", "Great, your profile is complete!")
                  : tr(
                      locale,
                      `Yana ${completeness.missing} ta maydonni to'ldiring, ishonch ortadi.`,
                      `Заполните ещё полей: ${completeness.missing}, это повысит доверие.`,
                      `Fill in ${completeness.missing} more field(s) to build trust.`
                    )}
              </p>
            </div>
          </div>
        </motion.aside>

        {/* ═════════ MAIN ═════════ */}
        <div className="min-w-0 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4"
          >
            {isMaster ? (
              <>
                <StatCard icon={<Star size={22} className="fill-current" />} label={t.ratingLabel} value={rating} tone="bg-amber-100 text-amber-500 dark:bg-amber-950/40" />
                <StatCard icon={<Package size={22} />} label={t.ordersLabel} value={counts.total} tone="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" />
                <StatCard icon={<CheckCircle2 size={22} />} label={t.completedLabel} value={counts.done} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
                <StatCard icon={<Clock size={22} />} label={tr(locale, "Jarayonda", "В процессе", "In progress")} value={counts.active} tone="bg-orange-100 text-[#F97316] dark:bg-orange-950/40" />
              </>
            ) : (
              <>
                <StatCard icon={<Package size={22} />} label={t.ordersLabel} value={counts.total} tone="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" />
                <StatCard icon={<Clock size={22} />} label={tr(locale, "Jarayonda", "В процессе", "In progress")} value={counts.active} tone="bg-orange-100 text-[#F97316] dark:bg-orange-950/40" />
                <StatCard icon={<CheckCircle2 size={22} />} label={t.completedLabel} value={counts.done} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
                <StatCard icon={<Star size={22} className="fill-current" />} label={t.ratingLabel} value={rating} tone="bg-amber-100 text-amber-500 dark:bg-amber-950/40" />
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="rounded-[2rem] border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8"
          >
            {isMaster ? <MasterProfile triggerToast={showToast} /> : <CustomerProfile triggerToast={showToast} />}
          </motion.div>
        </div>
      </div>

      {/* ─── Toasts ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            role="status"
            className="fixed inset-x-4 bottom-4 z-[9999] flex items-start gap-3.5 rounded-3xl border border-white/10 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm"
          >
            <div className="shrink-0 pt-0.5">
              {toastMsg.type === "success" && <CheckCircle2 className="text-green-400" size={20} />}
              {toastMsg.type === "error" && <AlertCircle className="text-red-400" size={20} />}
              {toastMsg.type === "info" && <Info className="text-blue-400" size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-0.5 text-xs font-extrabold uppercase tracking-widest text-[#F97316]">{t.toastTitle}</h4>
              <p className="text-[13px] font-bold leading-snug text-white">{toastMsg.title}</p>
              {toastMsg.desc && <p className="mt-1 text-[11px] font-medium leading-normal text-slate-300">{toastMsg.desc}</p>}
            </div>
            <button
              onClick={() => setToastMsg(null)}
              aria-label="Close"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
