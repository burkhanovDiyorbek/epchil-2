"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Loader2, Lock, MessageSquareWarning, Package, ShieldCheck, Star, Users, Wrench, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, tr } from "@/components/language-provider";
import { useAdminData, adminDataFromDocs } from "@/hooks/useAdminData";
import { computeStats, type AdminData } from "@/lib/admin-stats";
import { buildDemoDocs } from "@/lib/demo-data";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { MastersTab, OrdersTab, ReviewsTab, UsersTab } from "@/components/admin/ManageTabs";
import { ToolsTab } from "@/components/admin/ToolsTab";
import { Pill } from "@/components/admin/ui";

type TabKey = "overview" | "masters" | "orders" | "users" | "reviews" | "tools";

function filterDemo(d: AdminData, showDemo: boolean): AdminData {
  if (showDemo) return d;
  return {
    users: d.users.filter((u) => !u.isDemo),
    masters: d.masters.filter((m) => !m.isDemo),
    orders: d.orders.filter((o) => !o.isDemo),
    reviews: d.reviews.filter((r) => !r.isDemo),
    chats: d.chats.filter((c) => !c.isDemo),
  };
}

function AdminInner() {
  const { user, loading, isAdmin } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  // Dev-only design preview with synthetic data: /admin?preview=1 (never in production builds).
  const preview = process.env.NODE_ENV !== "production" && params?.get("preview") === "1";

  const [tab, setTab] = useState<TabKey>("overview");
  const [showDemo, setShowDemo] = useState(true);

  const live = useAdminData(isAdmin && !preview);
  const previewData = useMemo(() => (preview ? adminDataFromDocs(buildDemoDocs().docs) : null), [preview]);
  const raw = previewData ?? live.data;
  const data = useMemo(() => filterDemo(raw, showDemo), [raw, showDemo]);
  const stats = useMemo(() => computeStats(data), [data]);

  useEffect(() => {
    if (!preview && !loading && !user) router.replace("/");
  }, [preview, loading, user, router]);

  if (!preview && (loading || !user)) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <Loader2 className="animate-spin text-[#F97316]" size={36} />
      </div>
    );
  }

  if (!preview && !isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40">
            <Lock size={26} />
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{tr(locale, "Kirish taqiqlangan", "Доступ запрещён", "Access denied")}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {tr(
              locale,
              `Bu sahifa faqat administratorlar uchun. Siz ${user?.email} sifatida kirgansiz.`,
              `Эта страница только для администраторов. Вы вошли как ${user?.email}.`,
              `This page is for administrators only. You are signed in as ${user?.email}.`
            )}
          </p>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: typeof Users; badge?: number }[] = [
    { key: "overview", label: tr(locale, "Umumiy", "Обзор", "Overview"), icon: BarChart3 },
    { key: "masters", label: tr(locale, "Ustalar", "Мастера", "Masters"), icon: Wrench, badge: data.masters.filter((m) => !m.isVerified).length },
    { key: "orders", label: tr(locale, "Buyurtmalar", "Заказы", "Orders"), icon: Package, badge: stats.totals.reported },
    { key: "users", label: tr(locale, "Foydalanuvchilar", "Пользователи", "Users"), icon: Users },
    { key: "reviews", label: tr(locale, "Sharhlar", "Отзывы", "Reviews"), icon: Star },
    { key: "tools", label: tr(locale, "Asboblar", "Инструменты", "Tools"), icon: Settings2 },
  ];

  return (
    <div className="relative flex-1 overflow-hidden bg-[#F8FAFC] dark:bg-slate-950">
      <div className="pattern-star mask-fade pointer-events-none absolute inset-x-0 top-0 h-[360px] opacity-50" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 lg:py-8">
        {/* Title */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A365D] to-[#F97316] text-white shadow-lg shadow-orange-500/20">
                <ShieldCheck size={22} />
              </span>
              {tr(locale, "Admin panel", "Панель администратора", "Admin panel")}
              {preview && <Pill tone="purple">preview</Pill>}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {tr(locale, "Platforma statistikasi va boshqaruvi", "Статистика и управление платформой", "Platform statistics and management")}
            </p>
          </div>
          <label className="flex cursor-pointer select-none items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <input type="checkbox" checked={showDemo} onChange={(e) => setShowDemo(e.target.checked)} className="h-4 w-4 accent-[#F97316]" />
            {tr(locale, "Demo ma'lumotlarni ko'rsatish", "Показывать демо-данные", "Include demo data")}
          </label>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1.5 no-scrollbar dark:border-slate-800 dark:bg-slate-900/70">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex min-w-fit shrink-0 grow items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-white text-[#F97316] shadow-sm dark:bg-slate-800 dark:text-orange-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon size={16} /> {label}
              {!!badge && badge > 0 && <span className="rounded-full bg-[#F97316] px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
            </button>
          ))}
        </div>

        {live.error && !preview && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <MessageSquareWarning size={18} className="mt-0.5 shrink-0" />
            <span>
              {tr(
                locale,
                "Ma'lumotlarni o'qib bo'lmadi: Firestore qoidalari (firestore.rules) yangilanganini va hisobingiz admin ekanini tekshiring.",
                "Не удалось прочитать данные: проверьте, что правила Firestore (firestore.rules) обновлены и ваш аккаунт — администратор.",
                "Could not read the data: make sure the Firestore rules (firestore.rules) are published and your account is an admin."
              )}
            </span>
          </div>
        )}

        {live.loading && !preview ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-[#F97316]" size={32} />
          </div>
        ) : (
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {tab === "overview" && <OverviewTab stats={stats} />}
            {tab === "masters" && <MastersTab data={data} />}
            {tab === "orders" && <OrdersTab data={data} />}
            {tab === "users" && <UsersTab data={data} />}
            {tab === "reviews" && <ReviewsTab data={data} />}
            {tab === "tools" && <ToolsTab data={data} />}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-32">
          <Loader2 className="animate-spin text-[#F97316]" size={36} />
        </div>
      }
    >
      <AdminInner />
    </Suspense>
  );
}
