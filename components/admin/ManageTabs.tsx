"use client";

import { useMemo, useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { BadgeCheck, Ban, Eye, EyeOff, ShieldCheck, ShieldOff, Star, Trash2, UserCheck } from "lucide-react";
import { db } from "@/lib/firebase";
import { useLanguage, tr } from "@/components/language-provider";
import { categoryLabel } from "@/lib/categories";
import { placeLabel } from "@/lib/regions";
import { sendNotification } from "@/components/profile/notifications";
import type { AdminData } from "@/lib/admin-stats";
import { Card, Chips, ConfirmButton, EmptyRow, Pill, SearchBox, STATUS_TONE, formatDate, money, useStatusLabel } from "./ui";

const norm = (s: string) => s.toLowerCase();

/* ───────────────────────────── Masters ───────────────────────────── */
export function MastersTab({ data }: { data: AdminData }) {
  const { locale } = useLanguage();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified" | "hidden">("all");
  const [error, setError] = useState("");

  const doneByMaster = useMemo(() => {
    const m = new Map<string, number>();
    data.orders.filter((o) => o.status === "done").forEach((o) => m.set(o.masterId, (m.get(o.masterId) ?? 0) + 1));
    return m;
  }, [data.orders]);

  const rows = data.masters
    .filter((m) => (filter === "verified" ? m.isVerified : filter === "unverified" ? !m.isVerified : filter === "hidden" ? m.isHidden : true))
    .filter((m) => !q || norm(`${m.name} ${m.category} ${m.region} ${m.phone}`).includes(norm(q)))
    .sort((a, b) => Number(a.isVerified) - Number(b.isVerified) || (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

  const run = async (fn: () => Promise<void>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError(tr(locale, "Amal bajarilmadi (ruxsatlarni tekshiring).", "Действие не выполнено (проверьте права).", "Action failed (check permissions)."));
    }
  };

  const setVerified = (id: string, value: boolean) =>
    run(async () => {
      await updateDoc(doc(db, "masters", id), { isVerified: value });
      if (value && !id.startsWith("demo_")) {
        await sendNotification(
          id,
          tr(locale, "Profilingiz tasdiqlandi", "Ваш профиль подтверждён", "Your profile was verified"),
          tr(locale, "Endi sizda \"Tekshirilgan\" belgisi bor, mijozlar sizga ko'proq ishonadi.", "Теперь у вас значок «Проверен», клиенты будут доверять больше.", "You now have the \"Verified\" badge, clients will trust you more."),
          "",
          "message"
        );
      }
    });

  const setHidden = (id: string, value: boolean) => run(() => updateDoc(doc(db, "masters", id), { isHidden: value }));

  return (
    <Card
      title={`${tr(locale, "Ustalar", "Мастера", "Masters")} (${rows.length})`}
      action={<SearchBox value={q} onChange={setQ} placeholder={tr(locale, "Ism, kasb, hudud...", "Имя, профессия, регион...", "Name, trade, region...")} />}
    >
      <div className="mb-4">
        <Chips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: tr(locale, "Hammasi", "Все", "All"), count: data.masters.length },
            { value: "unverified", label: tr(locale, "Tekshirilmagan", "Не проверены", "Unverified"), count: data.masters.filter((m) => !m.isVerified).length },
            { value: "verified", label: tr(locale, "Tekshirilgan", "Проверены", "Verified"), count: data.masters.filter((m) => m.isVerified).length },
            { value: "hidden", label: tr(locale, "Yashirin", "Скрытые", "Hidden"), count: data.masters.filter((m) => m.isHidden).length },
          ]}
        />
      </div>
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {rows.length === 0 ? (
        <EmptyRow text={tr(locale, "Usta topilmadi", "Мастера не найдены", "No masters found")} />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-extrabold text-slate-900 dark:text-white">
                  {m.name || "—"}
                  {m.isVerified && <BadgeCheck size={16} className="fill-blue-500 text-white" />}
                  {m.isDemo && <Pill tone="purple">Demo</Pill>}
                </p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {categoryLabel(m.category, locale)} · {placeLabel(m.region, locale)}{m.district ? `, ${placeLabel(m.district, locale)}` : ""} · {money(m.basePrice)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {m.phone || "—"} · {tr(locale, "qo'shilgan", "с", "joined")} {formatDate(m.createdAt)} · {doneByMaster.get(m.id) ?? 0} {tr(locale, "ish bajargan", "выполнено", "jobs done")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!m.isAvailable && <Pill tone="slate">{tr(locale, "Band", "Занят", "Busy")}</Pill>}
                {m.isHidden && <Pill tone="red">{tr(locale, "Yashirin", "Скрыт", "Hidden")}</Pill>}
                {m.isVerified ? (
                  <ConfirmButton tone="slate" confirmLabel={tr(locale, "Tasdiqlaysizmi?", "Подтвердить?", "Confirm?")} onConfirm={() => setVerified(m.id, false)}>
                    <ShieldOff size={14} /> {tr(locale, "Belgini olish", "Снять значок", "Unverify")}
                  </ConfirmButton>
                ) : (
                  <ConfirmButton tone="green" confirmLabel={tr(locale, "Tasdiqlaysizmi?", "Подтвердить?", "Confirm?")} onConfirm={() => setVerified(m.id, true)}>
                    <ShieldCheck size={14} /> {tr(locale, "Tekshirish", "Проверить", "Verify")}
                  </ConfirmButton>
                )}
                <ConfirmButton tone="orange" confirmLabel={tr(locale, "Tasdiqlaysizmi?", "Подтвердить?", "Confirm?")} onConfirm={() => setHidden(m.id, !m.isHidden)}>
                  {m.isHidden ? <Eye size={14} /> : <EyeOff size={14} />} {m.isHidden ? tr(locale, "Ko'rsatish", "Показать", "Show") : tr(locale, "Yashirish", "Скрыть", "Hide")}
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ───────────────────────────── Orders ───────────────────────────── */
export function OrdersTab({ data }: { data: AdminData }) {
  const { locale } = useLanguage();
  const statusLabel = useStatusLabel();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.orders.length };
    data.orders.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [data.orders]);

  const rows = data.orders
    .filter((o) => status === "all" || o.status === status)
    .filter((o) => !q || norm(`${o.userName} ${o.masterName} ${o.problem} ${o.address} ${o.id}`).includes(norm(q)))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, 150);

  const resolve = async (id: string, next: "done" | "cancelled") => {
    setError("");
    try {
      await updateDoc(doc(db, "orders", id), { status: next, resolvedByAdmin: true });
    } catch (e) {
      console.error(e);
      setError(tr(locale, "Amal bajarilmadi (ruxsatlarni tekshiring).", "Действие не выполнено (проверьте права).", "Action failed (check permissions)."));
    }
  };

  return (
    <Card
      title={`${tr(locale, "Buyurtmalar", "Заказы", "Orders")} (${rows.length}${rows.length === 150 ? "+" : ""})`}
      action={<SearchBox value={q} onChange={setQ} placeholder={tr(locale, "Mijoz, usta, muammo...", "Клиент, мастер, проблема...", "Client, master, problem...")} />}
    >
      <div className="mb-4">
        <Chips
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: tr(locale, "Hammasi", "Все", "All"), count: counts.all },
            ...["pending", "accepted", "completed_by_master", "done", "cancelled", "reported"].map((s) => ({ value: s, label: statusLabel(s), count: counts[s] ?? 0 })),
          ]}
        />
      </div>
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {rows.length === 0 ? (
        <EmptyRow text={tr(locale, "Buyurtma topilmadi", "Заказы не найдены", "No orders found")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs font-bold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-3">{tr(locale, "Sana", "Дата", "Date")}</th>
                <th className="pb-3">{tr(locale, "Mijoz", "Клиент", "Client")}</th>
                <th className="pb-3">{tr(locale, "Usta", "Мастер", "Master")}</th>
                <th className="pb-3">{tr(locale, "Muammo", "Проблема", "Problem")}</th>
                <th className="pb-3">{tr(locale, "Holat", "Статус", "Status")}</th>
                <th className="pb-3 text-right">{tr(locale, "Summa", "Сумма", "Amount")}</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="whitespace-nowrap py-3 text-slate-500">{formatDate(o.createdAt)}</td>
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">{o.userName || "—"}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-200">
                    {o.masterName || "—"}
                    <span className="block text-xs text-slate-400">{categoryLabel(o.category, locale)}</span>
                  </td>
                  <td className="max-w-[240px] truncate py-3 text-slate-500" title={o.problem}>{o.problem || "—"}</td>
                  <td className="py-3">
                    <Pill tone={STATUS_TONE[o.status] ?? "slate"}>{statusLabel(o.status)}</Pill>
                    {o.isDemo && <span className="ml-1.5"><Pill tone="purple">Demo</Pill></span>}
                  </td>
                  <td className="whitespace-nowrap py-3 text-right font-semibold">{o.amount ? money(o.amount) : "—"}</td>
                  <td className="py-3 text-right">
                    {o.status === "reported" && (
                      <div className="flex justify-end gap-1.5">
                        <ConfirmButton tone="green" confirmLabel={tr(locale, "Ha?", "Да?", "Sure?")} onConfirm={() => resolve(o.id, "done")}>
                          {tr(locale, "Bajarildi", "Выполнен", "Done")}
                        </ConfirmButton>
                        <ConfirmButton tone="red" confirmLabel={tr(locale, "Ha?", "Да?", "Sure?")} onConfirm={() => resolve(o.id, "cancelled")}>
                          {tr(locale, "Bekor", "Отмена", "Cancel")}
                        </ConfirmButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ───────────────────────────── Users ───────────────────────────── */
export function UsersTab({ data }: { data: AdminData }) {
  const { locale } = useLanguage();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | "customer" | "master" | "blocked">("all");
  const [error, setError] = useState("");

  const ordersBy = useMemo(() => {
    const m = new Map<string, number>();
    data.orders.forEach((o) => {
      m.set(o.userId, (m.get(o.userId) ?? 0) + 1);
      m.set(o.masterId, (m.get(o.masterId) ?? 0) + 1);
    });
    return m;
  }, [data.orders]);

  const rows = data.users
    .filter((u) => (role === "blocked" ? u.blocked : role === "all" ? true : u.role === role))
    .filter((u) => !q || norm(`${u.name} ${u.email} ${u.phone} ${u.region}`).includes(norm(q)))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, 200);

  const setBlocked = async (id: string, value: boolean) => {
    setError("");
    try {
      await updateDoc(doc(db, "users", id), { blocked: value });
    } catch (e) {
      console.error(e);
      setError(tr(locale, "Amal bajarilmadi (ruxsatlarni tekshiring).", "Действие не выполнено (проверьте права).", "Action failed (check permissions)."));
    }
  };

  return (
    <Card
      title={`${tr(locale, "Foydalanuvchilar", "Пользователи", "Users")} (${rows.length})`}
      action={<SearchBox value={q} onChange={setQ} placeholder={tr(locale, "Ism, email, telefon...", "Имя, email, телефон...", "Name, email, phone...")} />}
    >
      <div className="mb-4">
        <Chips
          value={role}
          onChange={setRole}
          options={[
            { value: "all", label: tr(locale, "Hammasi", "Все", "All"), count: data.users.length },
            { value: "customer", label: tr(locale, "Mijozlar", "Клиенты", "Clients"), count: data.users.filter((u) => u.role === "customer").length },
            { value: "master", label: tr(locale, "Ustalar", "Мастера", "Masters"), count: data.users.filter((u) => u.role === "master").length },
            { value: "blocked", label: tr(locale, "Bloklangan", "Заблокированные", "Blocked"), count: data.users.filter((u) => u.blocked).length },
          ]}
        />
      </div>
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {rows.length === 0 ? (
        <EmptyRow text={tr(locale, "Foydalanuvchi topilmadi", "Пользователи не найдены", "No users found")} />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold text-slate-900 dark:text-white">
                  {u.name || u.email || u.id}
                  <Pill tone={u.role === "master" ? "orange" : u.role === "customer" ? "blue" : "slate"}>
                    {u.role === "master" ? tr(locale, "Usta", "Мастер", "Master") : u.role === "customer" ? tr(locale, "Mijoz", "Клиент", "Client") : tr(locale, "Rolsiz", "Без роли", "No role")}
                  </Pill>
                  {u.blocked && <Pill tone="red">{tr(locale, "Bloklangan", "Заблокирован", "Blocked")}</Pill>}
                  {u.isDemo && <Pill tone="purple">Demo</Pill>}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {u.email || "—"} · {u.phone || "—"} · {placeLabel(u.region, locale) || "—"} · {formatDate(u.createdAt)} · {ordersBy.get(u.id) ?? 0} {tr(locale, "buyurtma", "заказов", "orders")}
                </p>
              </div>
              {u.blocked ? (
                <ConfirmButton tone="green" confirmLabel={tr(locale, "Tasdiqlaysizmi?", "Подтвердить?", "Confirm?")} onConfirm={() => setBlocked(u.id, false)}>
                  <UserCheck size={14} /> {tr(locale, "Blokdan chiqarish", "Разблокировать", "Unblock")}
                </ConfirmButton>
              ) : (
                <ConfirmButton tone="red" confirmLabel={tr(locale, "Bloklaysizmi?", "Заблокировать?", "Block user?")} onConfirm={() => setBlocked(u.id, true)}>
                  <Ban size={14} /> {tr(locale, "Bloklash", "Заблокировать", "Block")}
                </ConfirmButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ───────────────────────────── Reviews ───────────────────────────── */
export function ReviewsTab({ data }: { data: AdminData }) {
  const { locale } = useLanguage();
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const masterName = useMemo(() => new Map(data.masters.map((m) => [m.id, m.name])), [data.masters]);
  const rows = data.reviews
    .filter((r) => r.direction === "c2m")
    .filter((r) => !q || norm(`${r.authorName} ${r.comment} ${masterName.get(r.toId) ?? ""}`).includes(norm(q)))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, 150);

  const remove = async (id: string) => {
    setError("");
    try {
      await deleteDoc(doc(db, "reviews", id));
    } catch (e) {
      console.error(e);
      setError(tr(locale, "O'chirib bo'lmadi (ruxsatlarni tekshiring).", "Не удалось удалить (проверьте права).", "Could not delete (check permissions)."));
    }
  };

  return (
    <Card
      title={`${tr(locale, "Sharhlar", "Отзывы", "Reviews")} (${rows.length})`}
      action={<SearchBox value={q} onChange={setQ} placeholder={tr(locale, "Muallif, matn, usta...", "Автор, текст, мастер...", "Author, text, master...")} />}
    >
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {rows.length === 0 ? (
        <EmptyRow text={tr(locale, "Sharhlar yo'q", "Отзывов нет", "No reviews")} />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    <Star size={11} className="fill-current" /> {r.rating}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{r.authorName || "—"}</span>
                  <span className="text-slate-400">→ {masterName.get(r.toId) ?? r.toId}</span>
                  <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                  {r.isDemo && <Pill tone="purple">Demo</Pill>}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment || "—"}</p>
              </div>
              <ConfirmButton tone="red" confirmLabel={tr(locale, "O'chirilsinmi?", "Удалить?", "Delete?")} onConfirm={() => remove(r.id)}>
                <Trash2 size={14} />
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
