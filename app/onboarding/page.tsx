"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, tr } from "@/components/language-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Bolt, CheckCircle2, Clock3, Loader2, MapPin, Phone, ShieldCheck,
  Sparkles, UserRound, Wrench, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/select";
import { RegionDistrictFields } from "@/components/forms/RegionDistrictFields";
import { formatUzPhone } from "@/lib/phone-mask";
import { categoryLabel } from "@/lib/categories";

type Role = "customer" | "master";

interface FormValues {
  name: string;
  phone: string;
  region: string;
  district: string;
  category: string;
  services: string;
  basePrice: string;
  bio: string;
}

// Values are stored in lowercase Uzbek so they match the catalog / AI categories.
const CATEGORY_VALUES = [
  "santexnik", "elektrik", "kafelchi", "romchi", "tozalovchi", "duradgor",
  "konditsioner", "quruvchi", "rassom", "maishiy texnika", "boshqa",
];

const STEP_FIELDS: Record<string, (keyof FormValues)[]> = {
  details: ["name", "phone", "region", "district"],
  personal: ["name", "phone", "region", "district"],
  work: ["category", "services", "basePrice"],
};

// ─── Small building blocks ───────────────────────────────────────────────────
function RoleCard({
  icon, title, description, selected, onClick,
}: {
  icon: React.ReactNode; title: string; description: string; selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex w-full flex-col items-start gap-4 rounded-3xl border-2 p-5 text-left transition-all duration-300 sm:p-6 ${
        selected
          ? "border-[#F97316] bg-orange-50 shadow-xl shadow-orange-500/10 dark:bg-orange-950/30"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      }`}
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
          selected ? "bg-[#F97316] text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        }`}
      >
        {icon}
      </span>
      <span>
        <span className={`block text-lg font-extrabold ${selected ? "text-[#F97316]" : "text-slate-900 dark:text-white"}`}>{title}</span>
        <span className="mt-1 block text-sm leading-snug text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      {selected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-4 text-[#F97316]">
          <CheckCircle2 size={22} />
        </motion.span>
      )}
    </motion.button>
  );
}

function Field({ label, icon, error, hint, children }: { label: string; icon?: React.ReactNode; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
        {icon} {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-500">{error}</p>
      ) : (
        hint && <p className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function Stepper({ labels, current }: { labels: string[]; current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors ${
                done
                  ? "bg-[#F97316] text-white"
                  : active
                  ? "border-2 border-[#F97316] bg-white text-[#F97316] dark:bg-slate-900"
                  : "border-2 border-slate-200 text-slate-400 dark:border-slate-700"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check size={15} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`hidden text-xs font-bold sm:inline ${active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{label}</span>
            {i < labels.length - 1 && (
              <span className={`h-0.5 flex-1 rounded-full ${done ? "bg-[#F97316]" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const steps = role === "master" ? ["role", "personal", "work"] : role === "customer" ? ["role", "details"] : ["role"];
  const stepKey = steps[stepIdx] ?? "role";
  const stepLabels =
    role === "master"
      ? [tr(locale, "Rol", "Роль", "Role"), tr(locale, "Shaxsiy ma'lumot", "Личные данные", "Personal info"), tr(locale, "Kasb", "Профессия", "Profession")]
      : [tr(locale, "Rol", "Роль", "Role"), tr(locale, "Ma'lumotlar", "Данные", "Details")];

  const schema = useMemo(() => {
    const nameMsg = tr(locale, "Ism kamida 2 ta harf bo'lishi kerak", "Имя должно содержать минимум 2 буквы", "Name must be at least 2 characters");
    const phoneMsg = tr(locale, "To'liq telefon raqamini kiriting: +998 (XX) XXX-XX-XX", "Введите полный номер: +998 (XX) XXX-XX-XX", "Enter the full number: +998 (XX) XXX-XX-XX");
    const base = {
      name: z.string().trim().min(2, nameMsg),
      phone: z.string().refine((v) => v.replace(/\D/g, "").length === 12, phoneMsg),
      region: z.string().min(1, tr(locale, "Viloyatni tanlang", "Выберите область", "Select a region")),
      district: z.string().trim().min(2, tr(locale, "Tumanni kiriting", "Укажите район", "Enter a district")),
    };
    if (role !== "master") return z.object(base);
    return z.object({
      ...base,
      category: z.string().min(1, tr(locale, "Kasbni tanlang", "Выберите профессию", "Choose a trade")),
      services: z.string().trim().min(2, tr(locale, "Kamida bitta xizmat kiriting", "Укажите хотя бы одну услугу", "Enter at least one service")),
      basePrice: z
        .string()
        .refine((v) => Number(v) >= 1000, tr(locale, "Boshlang'ich narx kamida 1 000 so'm", "Начальная цена не менее 1 000 сум", "Starting price must be at least 1,000 UZS")),
      bio: z.string().optional(),
    });
  }, [locale, role]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    mode: "onTouched",
    defaultValues: { name: "", phone: "", region: "", district: "", category: "", services: "", basePrice: "", bio: "" },
  });
  const { control, register, trigger, handleSubmit, formState: { errors } } = form;

  // Pre-fill what we already know from sign-up.
  useEffect(() => {
    if (user?.displayName && !form.getValues("name")) form.setValue("name", user.displayName);
  }, [user, form]);

  // Redirect if user already has role
  useEffect(() => {
    // Design preview only: NEXT_PUBLIC_PREVIEW_ONBOARDING=1 keeps the wizard visible for signed-in users.
    if (process.env.NEXT_PUBLIC_PREVIEW_ONBOARDING === "1") return;
    if (!loading) {
      if (!user) { router.replace("/"); return; }
      if (profile?.role === "customer") { router.replace("/booking"); return; }
      if (profile?.role === "master") { router.replace("/profile"); return; }
    }
  }, [user, profile, loading, router]);

  const describeError = (err: unknown) => {
    const code = (err as { code?: string })?.code;
    if (code === "permission-denied") {
      return tr(
        locale,
        "Ma'lumotlarni saqlashga ruxsat yo'q. Firebase Firestore qoidalari (Rules) yangilanishi kerak.",
        "Нет прав на сохранение данных. Необходимо обновить правила Firebase Firestore (Rules).",
        "Saving is not permitted. The Firebase Firestore Rules need to be updated."
      );
    }
    return tr(locale, "Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.", "Ошибка при сохранении. Попробуйте ещё раз.", "Something went wrong while saving. Please try again.");
  };

  const goNext = async () => {
    if (stepKey === "role") {
      if (role) setStepIdx(1);
      return;
    }
    if (await trigger(STEP_FIELDS[stepKey])) setStepIdx((i) => i + 1);
  };

  const submit = async (data: FormValues) => {
    if (!user || !role) return;
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const base = {
        uid: user.uid,
        role,
        name: data.name.trim(),
        phone: data.phone,
        email: user.email || "",
        region: data.region,
        district: data.district.trim(),
        createdAt: serverTimestamp(),
      };
      if (role === "customer") {
        await setDoc(doc(db, "users", user.uid), base, { merge: true });
        await refreshProfile();
        router.replace("/booking");
        return;
      }
      const userPayload = {
        ...base,
        category: data.category,
        services: data.services.split(",").map((s) => s.trim()).filter(Boolean),
        basePrice: Number(data.basePrice),
        bio: data.bio?.trim() || "",
      };
      const masterPayload = {
        ...userPayload,
        firstName: data.name.trim().split(" ")[0] || data.name.trim(),
        lastName: data.name.trim().split(" ").slice(1).join(" "),
        isVerified: false,
        isAvailable: true,
      };
      await Promise.all([
        setDoc(doc(db, "users", user.uid), userPayload, { merge: true }),
        setDoc(doc(db, "masters", user.uid), masterPayload, { merge: true }),
      ]);
      await refreshProfile();
      router.replace("/profile");
    } catch (err) {
      console.error(err);
      setSubmitError(describeError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center">
        <Loader2 className="animate-spin text-[#F97316]" size={40} />
      </div>
    );
  }

  const perks = [
    { icon: ShieldCheck, text: tr(locale, "Tekshirilgan ustalar va real reytinglar", "Проверенные мастера и реальные рейтинги", "Verified masters and real ratings") },
    { icon: Sparkles, text: tr(locale, "AI eng mos ustani bir necha soniyada topadi", "ИИ находит подходящего мастера за секунды", "AI finds the best match in seconds") },
    { icon: Clock3, text: tr(locale, "Buyurtma va chat bir joyda, 24/7", "Заказы и чат в одном месте, 24/7", "Orders and chat in one place, 24/7") },
  ];

  const isLast = stepIdx === steps.length - 1 && stepKey !== "role";
  const heading =
    stepKey === "role"
      ? tr(locale, "Siz kim sifatida kirasiz?", "Кем вы хотите войти?", "How will you use Epchil?")
      : stepKey === "work"
      ? tr(locale, "Kasbingiz haqida", "О вашей профессии", "About your trade")
      : tr(locale, "O'zingiz haqingizda", "О вас", "About you");
  const subheading =
    stepKey === "role"
      ? tr(locale, "Rolni tanlang. Keyin o'zgartirish mumkin.", "Выберите роль. Её можно изменить позже.", "Pick a role. You can change it later.")
      : tr(locale, "Bir daqiqadan kam vaqt oladi.", "Займёт меньше минуты.", "Takes less than a minute.");

  const inputCls = "h-12 rounded-xl";

  return (
    <div className="relative flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="pattern-star mask-fade pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      {/* Brand panel (desktop) */}
      <aside className="relative hidden w-[42%] max-w-xl shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1A365D] via-[#16294a] to-[#0F1F3D] p-12 text-white lg:flex">
        <div className="pattern-star absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F97316]/30 blur-[90px]" aria-hidden="true" />
        <div className="relative flex items-center gap-2 text-2xl font-bold">
          <span className="rounded-xl bg-gradient-to-br from-[#F97316] to-orange-500 p-1.5 shadow-lg shadow-orange-500/30"><Bolt size={22} /></span>
          Epchil
        </div>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight text-balance">
            {tr(locale, "Xush kelibsiz, Epchilga!", "Добро пожаловать в Epchil!", "Welcome to Epchil!")}
          </h2>
          <p className="mt-3 text-slate-300">
            {tr(locale, "Uy xizmatlari uchun aqlli platforma.", "Умная платформа для домашних услуг.", "The smart platform for home services.")}
          </p>
          <ul className="mt-10 space-y-5">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-300"><Icon size={20} /></span>
                <span className="text-sm font-medium text-slate-100">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} Epchil</p>
      </aside>

      {/* Wizard */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 text-balance dark:text-white sm:text-4xl">{heading}</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{subheading}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            {role && <Stepper labels={stepLabels} current={stepIdx} />}

            <form
              onSubmit={handleSubmit(submit)}
              onKeyDown={(e) => {
                // Enter moves to the next step instead of submitting early.
                if (e.key === "Enter" && !isLast && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                  e.preventDefault();
                  goNext();
                }
              }}
            >
              <AnimatePresence mode="wait">
                {stepKey === "role" && (
                  <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <RoleCard
                      icon={<UserRound size={28} />}
                      title={tr(locale, "Men Mijozman", "Я клиент", "I'm a client")}
                      description={tr(locale, "Uy muammolarimni hal qilish uchun ishonchli usta topmoqchiman", "Хочу найти надёжного мастера для домашних задач", "I want a trusted master for my home problems")}
                      selected={role === "customer"}
                      onClick={() => setRole("customer")}
                    />
                    <RoleCard
                      icon={<Wrench size={28} />}
                      title={tr(locale, "Men Ustaman", "Я мастер", "I'm a master")}
                      description={tr(locale, "Mahoratimni ko'rsatib, yangi mijozlar topmoqchiman", "Хочу показать мастерство и найти клиентов", "I want to showcase my skills and find clients")}
                      selected={role === "master"}
                      onClick={() => setRole("master")}
                    />
                  </motion.div>
                )}

                {(stepKey === "details" || stepKey === "personal") && (
                  <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <Field label={tr(locale, "To'liq ismingiz", "Полное имя", "Full name")} icon={<UserRound size={14} />} error={errors.name?.message}>
                      <Input {...register("name")} autoComplete="name" className={inputCls} placeholder={tr(locale, "Masalan: Jasur Karimov", "Например: Жасур Каримов", "E.g. Jasur Karimov")} />
                    </Field>
                    <Field
                      label={tr(locale, "Telefon raqamingiz", "Номер телефона", "Phone number")}
                      icon={<Phone size={14} />}
                      error={errors.phone?.message}
                      hint={role === "master"
                        ? tr(locale, "Mijozlar buyurtma tasdiqlangach siz bilan shu raqam orqali bog'lanadi", "Клиенты свяжутся с вами по этому номеру после подтверждения заказа", "Clients will reach you on this number after an order is confirmed")
                        : tr(locale, "Usta siz bilan shu raqam orqali bog'lanadi", "Мастер свяжется с вами по этому номеру", "The master will contact you on this number")}
                    >
                      <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            className={inputCls}
                            placeholder="+998 (90) 123-45-67"
                            onFocus={() => { if (!field.value) field.onChange("+998"); }}
                            onChange={(e) => field.onChange(formatUzPhone(e.target.value))}
                          />
                        )}
                      />
                    </Field>
                    <Controller
                      control={control}
                      name="region"
                      render={({ field: regionField }) => (
                        <Controller
                          control={control}
                          name="district"
                          render={({ field: districtField }) => (
                            <RegionDistrictFields
                              region={regionField.value}
                              district={districtField.value}
                              onRegionChange={regionField.onChange}
                              onDistrictChange={districtField.onChange}
                              regionError={errors.region?.message}
                              districtError={errors.district?.message}
                              regionLabel={<Label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300"><MapPin size={14} /> {tr(locale, "Viloyat", "Область", "Region")}</Label>}
                              districtLabel={<Label className="flex min-h-5 items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">{tr(locale, "Tuman", "Район", "District")}</Label>}
                            />
                          )}
                        />
                      )}
                    />
                  </motion.div>
                )}

                {stepKey === "work" && (
                  <motion.div key="work" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <Field label={tr(locale, "Kasb / Mutaxassislik", "Профессия / Специальность", "Trade / Specialization")} icon={<Wrench size={14} />} error={errors.category?.message}>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <CustomSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={CATEGORY_VALUES.map((v) => ({ value: v, label: categoryLabel(v, locale) }))}
                            placeholder={tr(locale, "Kasbni tanlang", "Выберите профессию", "Choose your trade")}
                            invalid={!!errors.category}
                          />
                        )}
                      />
                    </Field>
                    <Field
                      label={tr(locale, "Xizmat turlari (vergul bilan ajrating)", "Виды услуг (через запятую)", "Services (comma separated)")}
                      error={errors.services?.message}
                    >
                      <Input {...register("services")} className={inputCls} placeholder={tr(locale, "Masalan: Rozetka, Sim, Lampa o'rnatish", "Например: Розетки, проводка, установка ламп", "E.g. Sockets, wiring, lamp fitting")} />
                    </Field>
                    <Field label={tr(locale, "Boshlang'ich narx (so'm)", "Начальная цена (сум)", "Starting price (UZS)")} error={errors.basePrice?.message}>
                      <Input {...register("basePrice")} type="number" inputMode="numeric" className={inputCls} placeholder="50000" />
                    </Field>
                    <Field label={tr(locale, "O'zingiz haqingizda (ixtiyoriy)", "О себе (необязательно)", "About you (optional)")}>
                      <textarea
                        {...register("bio")}
                        className="flex min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        placeholder={tr(locale, "5 yillik tajribam bor, tez va sifatli xizmat ko'rsataman...", "У меня 5 лет опыта, работаю быстро и качественно...", "I have 5 years of experience and deliver fast, quality work...")}
                      />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>

              {submitError && (
                <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {submitError}
                </p>
              )}

              <div className="mt-8 flex gap-3">
                {stepIdx > 0 && (
                  <Button type="button" variant="outline" onClick={() => setStepIdx((i) => i - 1)} className="h-12 rounded-xl px-5">
                    <ArrowLeft size={16} className="mr-1.5" /> {tr(locale, "Orqaga", "Назад", "Back")}
                  </Button>
                )}
                {isLast ? (
                  <Button type="submit" disabled={isSubmitting} className="h-12 flex-1 rounded-xl bg-[#F97316] font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-[#EA580C]">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                      <>
                        <CheckCircle2 size={18} className="mr-2" />
                        {role === "master" ? tr(locale, "Profilni yaratish", "Создать профиль", "Create profile") : tr(locale, "Boshlash", "Начать", "Get started")}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={stepKey === "role" && !role}
                    className="h-12 flex-1 rounded-xl bg-[#F97316] font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-[#EA580C] disabled:opacity-40"
                  >
                    {tr(locale, "Davom etish", "Продолжить", "Continue")} <ArrowRight size={18} className="ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
