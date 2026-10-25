"use client";

import { Users, Wrench, Package, Wallet, CheckCircle2, TrendingUp, Star, MessageSquare, ShieldCheck, AlertTriangle, UserPlus, Ban } from "lucide-react";
import { useLanguage, tr } from "@/components/language-provider";
import { categoryLabel } from "@/lib/categories";
import { placeLabel } from "@/lib/regions";
import type { Stats } from "@/lib/admin-stats";
import { BarChart, Donut, Funnel, HBars } from "./charts";
import { Card, Pill, StatTile, STATUS_COLOR, money, moneyShort, useStatusLabel } from "./ui";

export function OverviewTab({ stats }: { stats: Stats }) {
  const { locale } = useLanguage();
  const statusLabel = useStatusLabel();
  const t = stats.totals;
  const empty = tr(locale, "Hozircha ma'lumot yo'q", "Пока нет данных", "No data yet");

  const funnelLabels: Record<string, string> = {
    orders: tr(locale, "Buyurtma berildi", "Заказ создан", "Order placed"),
    accepted: tr(locale, "Usta qabul qildi", "Мастер принял", "Master accepted"),
    finished: tr(locale, "Usta bitirdi", "Мастер завершил", "Master finished"),
    done: tr(locale, "Mijoz tasdiqladi", "Клиент подтвердил", "Client confirmed"),
    reviewed: tr(locale, "Sharh qoldirildi", "Оставлен отзыв", "Reviewed"),
  };

  return (
    <div className="space-y-6">
      {/* KPI row 1 */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={<Users size={22} />} tone="blue" label={tr(locale, "Foydalanuvchilar", "Пользователи", "Users")} value={t.users}
          sub={`${t.customers} ${tr(locale, "mijoz", "клиентов", "clients")} · +${t.newUsers7d} / 7d`} />
        <StatTile icon={<Wrench size={22} />} tone="orange" label={tr(locale, "Ustalar", "Мастера", "Masters")} value={t.masters}
          sub={`${t.verifiedMasters} ${tr(locale, "tekshirilgan", "проверено", "verified")} · ${t.availableMasters} ${tr(locale, "faol", "активны", "active")}`} />
        <StatTile icon={<Package size={22} />} tone="purple" label={tr(locale, "Buyurtmalar", "Заказы", "Orders")} value={t.orders}
          sub={`${t.active} ${tr(locale, "jarayonda", "в процессе", "in progress")} · +${t.orders7d} / 7d`} />
        <StatTile icon={<Wallet size={22} />} tone="green" label={tr(locale, "Aylanma (GMV)", "Оборот (GMV)", "Turnover (GMV)")} value={moneyShort(t.gmv)}
          sub={`${tr(locale, "30 kun", "30 дней", "30 days")}: ${moneyShort(t.gmv30d)}`} />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={<CheckCircle2 size={22} />} tone="green" label={tr(locale, "Bajarilish ulushi", "Доля выполнения", "Completion rate")} value={`${t.completionRate}%`}
          sub={`${t.done} ${tr(locale, "bajarildi", "выполнено", "done")} · ${t.cancelled} ${tr(locale, "bekor", "отмен", "cancelled")}`} />
        <StatTile icon={<TrendingUp size={22} />} tone="amber" label={tr(locale, "O'rtacha chek", "Средний чек", "Average order")} value={t.avgOrder ? moneyShort(t.avgOrder) : "—"}
          sub={t.avgOrder ? money(t.avgOrder) : undefined} />
        <StatTile icon={<Star size={22} className="fill-current" />} tone="amber" label={tr(locale, "O'rtacha reyting", "Средний рейтинг", "Average rating")} value={t.avgRating !== null ? t.avgRating.toFixed(1) : "—"}
          sub={`${t.reviews} ${tr(locale, "sharh", "отзывов", "reviews")}`} />
        <StatTile icon={<MessageSquare size={22} />} tone="blue" label={tr(locale, "Suhbatlar", "Диалоги", "Conversations")} value={t.chats}
          sub={`${t.newUsers30d} ${tr(locale, "yangi foydalanuvchi / 30 kun", "новых польз. / 30 дней", "new users / 30d")}`} />
      </div>

      {/* Attention */}
      {(t.reported > 0 || t.masters - t.verifiedMasters > 0 || t.blocked > 0) && (
        <Card title={tr(locale, "E'tibor talab qiladi", "Требует внимания", "Needs attention")}>
          <div className="flex flex-wrap gap-2.5">
            {t.reported > 0 && (
              <Pill tone="orange"><AlertTriangle size={13} /> {t.reported} {tr(locale, "ta shikoyat qilingan buyurtma", "заказов с жалобой", "reported orders")}</Pill>
            )}
            {t.masters - t.verifiedMasters > 0 && (
              <Pill tone="amber"><ShieldCheck size={13} /> {t.masters - t.verifiedMasters} {tr(locale, "usta tekshiruvni kutmoqda", "мастеров ждут проверки", "masters awaiting verification")}</Pill>
            )}
            {t.blocked > 0 && <Pill tone="red"><Ban size={13} /> {t.blocked} {tr(locale, "bloklangan", "заблокировано", "blocked")}</Pill>}
          </div>
        </Card>
      )}

      {/* Time series */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={tr(locale, "Buyurtmalar (30 kun)", "Заказы (30 дней)", "Orders (30 days)")}>
          <BarChart data={stats.ordersPerDay} every={5} />
        </Card>
        <Card title={tr(locale, "Yangi foydalanuvchilar (30 kun)", "Новые пользователи (30 дней)", "New users (30 days)")}>
          <BarChart data={stats.signupsPerDay} every={5} color="#1A365D" />
        </Card>
        <Card title={tr(locale, "Haftalik aylanma (8 hafta)", "Оборот по неделям (8 недель)", "Weekly turnover (8 weeks)")}>
          <BarChart data={stats.gmvPerWeek} color="#10B981" format={(n) => money(n)} />
        </Card>
        <Card title={tr(locale, "Buyurtma holatlari", "Статусы заказов", "Order statuses")}>
          <Donut
            centerLabel={tr(locale, "jami", "всего", "total")}
            segments={stats.byStatus.map((s) => ({ label: statusLabel(s.label), value: s.value, color: STATUS_COLOR[s.label] }))}
          />
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={tr(locale, "Kasblar bo'yicha buyurtmalar", "Заказы по профессиям", "Orders by trade")}>
          <HBars
            empty={empty}
            color="#F97316"
            items={stats.byCategory.map((p) => ({ label: categoryLabel(p.label, locale) || p.label, value: p.value }))}
          />
        </Card>
        <Card title={tr(locale, "Hududlar bo'yicha buyurtmalar", "Заказы по регионам", "Orders by region")}>
          <HBars empty={empty} items={stats.byRegion.map((p) => ({ label: placeLabel(p.label, locale), value: p.value }))} />
        </Card>
        <Card title={tr(locale, "Hududlar bo'yicha ustalar", "Мастера по регионам", "Masters by region")}>
          <HBars empty={empty} color="#3B82F6" items={stats.mastersByRegion.map((p) => ({ label: placeLabel(p.label, locale), value: p.value }))} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={tr(locale, "Buyurtma voronkasi", "Воронка заказов", "Order funnel")}>
          <Funnel steps={stats.funnel.map((f) => ({ label: funnelLabels[f.label] ?? f.label, value: f.value }))} />
        </Card>
        <Card title={tr(locale, "Reyting taqsimoti", "Распределение оценок", "Rating distribution")}>
          <HBars
            empty={empty}
            color="#F59E0B"
            limit={5}
            items={stats.ratingDistribution.map((p) => ({ label: `${p.label} ★`, value: p.value }))}
          />
        </Card>
      </div>

      {/* Top masters */}
      <Card title={tr(locale, "Eng yaxshi ustalar", "Лучшие мастера", "Top masters")}>
        {stats.topMasters.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-3">#</th>
                  <th className="pb-3">{tr(locale, "Usta", "Мастер", "Master")}</th>
                  <th className="pb-3">{tr(locale, "Kasb", "Профессия", "Trade")}</th>
                  <th className="pb-3 text-right">{tr(locale, "Bajarilgan", "Выполнено", "Done")}</th>
                  <th className="pb-3 text-right">GMV</th>
                  <th className="pb-3 text-right">{tr(locale, "Reyting", "Рейтинг", "Rating")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.topMasters.map((m, i) => (
                  <tr key={m.id}>
                    <td className="py-3 font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{m.name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{categoryLabel(m.category, locale)}</td>
                    <td className="py-3 text-right font-semibold">{m.done}</td>
                    <td className="py-3 text-right font-semibold">{money(m.gmv)}</td>
                    <td className="py-3 text-right">
                      {m.rating !== null ? <span className="inline-flex items-center gap-1 font-bold text-amber-600"><Star size={12} className="fill-current" /> {m.rating.toFixed(1)} <span className="font-medium text-slate-400">({m.reviews})</span></span> : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="flex items-center gap-2 text-xs text-slate-400"><UserPlus size={13} /> {tr(locale, "Ma'lumotlar real vaqtda yangilanadi.", "Данные обновляются в реальном времени.", "Data updates in real time.")}</p>
    </div>
  );
}
