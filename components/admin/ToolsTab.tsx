"use client";

import { useState } from "react";
import { Database, Download, Loader2, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, tr } from "@/components/language-provider";
import { ADMIN_EMAILS } from "@/lib/admin";
import { clearDemoData, seedDemoData, type SeedSummary } from "@/lib/demo-data";
import type { AdminData } from "@/lib/admin-stats";
import { Button } from "@/components/ui/button";
import { Card, ConfirmButton } from "./ui";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ToolsTab({ data }: { data: AdminData }) {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const seed = async () => {
    setBusy("seed");
    setError("");
    setMessage("");
    try {
      const s: SeedSummary = await seedDemoData();
      setMessage(
        tr(
          locale,
          `Yaratildi: ${s.masters} usta, ${s.customers} mijoz, ${s.orders} buyurtma, ${s.reviews} sharh.`,
          `Создано: ${s.masters} мастеров, ${s.customers} клиентов, ${s.orders} заказов, ${s.reviews} отзывов.`,
          `Created: ${s.masters} masters, ${s.customers} clients, ${s.orders} orders, ${s.reviews} reviews.`
        )
      );
    } catch (e) {
      console.error(e);
      setError(tr(locale, "Demo ma'lumot yaratilmadi. Admin ruxsatlari va Firestore qoidalarini tekshiring.", "Не удалось создать демо-данные. Проверьте права администратора и правила Firestore.", "Could not create demo data. Check admin access and the Firestore rules."));
    } finally {
      setBusy(null);
    }
  };

  const clear = async () => {
    setBusy("clear");
    setError("");
    setMessage("");
    try {
      const n = await clearDemoData();
      setMessage(tr(locale, `${n} ta demo hujjat o'chirildi.`, `Удалено демо-документов: ${n}.`, `Deleted ${n} demo documents.`));
    } catch (e) {
      console.error(e);
      setError(tr(locale, "Demo ma'lumotni o'chirib bo'lmadi.", "Не удалось удалить демо-данные.", "Could not delete demo data."));
    } finally {
      setBusy(null);
    }
  };

  const demoCount = data.users.filter((u) => u.isDemo).length + data.orders.filter((o) => o.isDemo).length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title={<span className="flex items-center gap-2"><Database size={18} className="text-[#F97316]" /> {tr(locale, "Demo ma'lumotlar", "Демо-данные", "Demo data")}</span>}>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {tr(
            locale,
            "Statistika va pitch uchun soxta ustalar, mijozlar, buyurtmalar va sharhlar yaratadi. Hammasi \"Demo\" belgisi bilan, haqiqiy foydalanuvchilarga aralashmaydi va ommaviy katalogda ko'rinmaydi. Autentifikatsiya hisoblari yaratilmaydi.",
            "Создаёт вымышленных мастеров, клиентов, заказы и отзывы для статистики и питча. Всё помечено «Demo», не смешивается с реальными пользователями и не показывается в публичном каталоге. Аккаунты авторизации не создаются.",
            "Creates fake masters, clients, orders and reviews for statistics and the pitch. Everything is tagged \"Demo\", stays separate from real users and is hidden from the public catalog. No auth accounts are created."
          )}
        </p>
        <p className="mt-3 text-xs font-semibold text-slate-400">
          {tr(locale, "Hozir bazada demo yozuvlar:", "Сейчас демо-записей в базе:", "Demo records in the database now:")} {demoCount}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={seed} disabled={busy !== null} className="h-11 gap-2 rounded-xl bg-[#F97316] px-5 font-bold text-white hover:bg-[#EA580C]">
            {busy === "seed" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {tr(locale, "Demo ma'lumot yaratish", "Создать демо-данные", "Generate demo data")}
          </Button>
          <ConfirmButton tone="red" disabled={busy !== null} confirmLabel={tr(locale, "Hammasi o'chiriladi. Tasdiqlaysizmi?", "Всё будет удалено. Подтвердить?", "Delete all demo data?")} onConfirm={clear}>
            {busy === "clear" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} {tr(locale, "Demo ma'lumotni o'chirish", "Удалить демо-данные", "Delete demo data")}
          </ConfirmButton>
        </div>
        {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      </Card>

      <Card title={<span className="flex items-center gap-2"><Download size={18} className="text-[#F97316]" /> {tr(locale, "Eksport (CSV)", "Экспорт (CSV)", "Export (CSV)")}</span>}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          {tr(locale, "Jadvallarni Excel yoki Google Sheets'da ochish uchun yuklab oling.", "Скачайте таблицы для Excel или Google Sheets.", "Download tables to open in Excel or Google Sheets.")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4"
            onClick={() =>
              downloadCsv("orders.csv", [
                ["id", "date", "client", "master", "category", "status", "amount"],
                ...data.orders.map((o) => [o.id, o.createdAt?.toISOString() ?? "", o.userName, o.masterName, o.category, o.status, o.amount]),
              ])
            }
          >
            {tr(locale, "Buyurtmalar", "Заказы", "Orders")} ({data.orders.length})
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4"
            onClick={() =>
              downloadCsv("users.csv", [
                ["id", "role", "name", "email", "phone", "region", "blocked", "created"],
                ...data.users.map((u) => [u.id, u.role ?? "", u.name, u.email, u.phone, u.region, u.blocked ? "yes" : "", u.createdAt?.toISOString() ?? ""]),
              ])
            }
          >
            {tr(locale, "Foydalanuvchilar", "Пользователи", "Users")} ({data.users.length})
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4"
            onClick={() =>
              downloadCsv("masters.csv", [
                ["id", "name", "category", "region", "district", "phone", "price", "verified", "hidden"],
                ...data.masters.map((m) => [m.id, m.name, m.category, m.region, m.district, m.phone, m.basePrice, m.isVerified ? "yes" : "", m.isHidden ? "yes" : ""]),
              ])
            }
          >
            {tr(locale, "Ustalar", "Мастера", "Masters")} ({data.masters.length})
          </Button>
        </div>
      </Card>

      <Card className="lg:col-span-2" title={<span className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#F97316]" /> {tr(locale, "Administratorlar", "Администраторы", "Administrators")}</span>}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {tr(locale, "Siz kirdingiz:", "Вы вошли как:", "Signed in as:")} <b>{user?.email}</b>
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ADMIN_EMAILS.map((e) => (
            <li key={e} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{e}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          {tr(
            locale,
            "Yangi admin qo'shish: Firebase Console → Firestore → admins kolleksiyasida hujjat yarating (hujjat id = foydalanuvchi uid). Qayta deploy kerak emas. Yoki lib/admin.ts va firestore.rules dagi email ro'yxatini tahrirlang.",
            "Добавить админа: Firebase Console → Firestore → коллекция admins, документ с id = uid пользователя. Повторный деплой не нужен. Либо измените список email в lib/admin.ts и firestore.rules.",
            "To add an admin: Firebase Console → Firestore → collection admins, create a document whose id is the user's uid. No redeploy needed. Or edit the email list in lib/admin.ts and firestore.rules."
          )}
        </p>
      </Card>
    </div>
  );
}
