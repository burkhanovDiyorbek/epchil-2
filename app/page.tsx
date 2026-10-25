"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, type Variants } from "framer-motion";
import {
  Bot, Bolt, Clock3, MapPin, ShieldCheck, Sparkles, Star, WalletCards,
  BrainCircuit, Mic, ArrowRight, Droplets, Grid3x3, WashingMachine, AppWindow,
  SprayCan, AirVent, Hammer, Wrench, Languages, Infinity as InfinityIcon,
  Gift, MessageSquareText, UserCheck, Handshake, TrendingUp, BellRing, BadgeCheck,
  CheckCircle2, Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, pick } from "@/components/language-provider";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const AiModal = dynamic(() => import("@/components/ai-modal").then((m) => m.AiModal), { ssr: false });

type L3 = { uz: string; ru: string; en: string };

/* ───────────────────────── Content (uz / ru / en) ───────────────────────── */
const dict = {
  uz: {
    badge: "Yangi AI qidiruv tizimi",
    heroTitle1: "Usta topishning",
    heroHighlight: "aqlli",
    heroTitle2: "usuli",
    heroDesc: "Epchil AI agenti eng yaxshi ustani eng qisqa fursatda va eng hamyonbop narxda topib beradi.",
    aiCardText: "Muammoni ayting, AI sizga eng arzon va ishonchli ustani 5 soniyada topib beradi.",
    cta: "Usta chaqirish",
    tapToTalk: "Gapirish uchun bosing",
    servicesEyebrow: "Xizmatlar",
    servicesTitle: "Ommabop xizmatlar",
    servicesSub: "Uydagi har qanday muammo uchun mutaxassis bir necha bosishda.",
    callMaster: "Usta chaqirish",
    howEyebrow: "Jarayon",
    howTitle: "Qanday ishlaydi?",
    howSub: "Uch oddiy qadam: aytasiz, AI tanlaydi, usta keladi.",
    aiBadge: "Aqlli izlash",
    aiTitle: "AI agent sizga qanday yordam beradi?",
    aiSubtitle: "Eng tez, eng arzon va eng sifatli yechim, sun'iy intellekt orqali.",
    mastersEyebrow: "Ustalar uchun",
    mastersTitle: "Ustamisiz? Mijozlar o'zi sizni topadi",
    mastersDesc: "Reklamasiz yangi buyurtmalar, reyting orqali obro' va bitta joyda barcha ishlaringiz.",
    mastersCta: "Usta sifatida qo'shilish",
    pilotEyebrow: "Hududlar",
    pilotTitle: "Birinchi hududlarda ishga tushmoqdamiz",
    soon: "Tez orada",
    live: "Faol",
    faqTitle: "Ko'p so'raladigan savollar",
    finalTitle: "Muammo kutmasin. Hoziroq ustani toping.",
    finalDesc: "Bitta tugma, bir necha soniya va eng mos usta sizga yo'lda.",
  },
  ru: {
    badge: "Новая система поиска с ИИ",
    heroTitle1: "Умный способ",
    heroHighlight: "найти",
    heroTitle2: "мастера",
    heroDesc: "AI-агент Epchil подбирает лучшего мастера по цене, скорости и рейтингу за считанные минуты.",
    aiCardText: "Скажите проблему, ИИ найдёт самого выгодного и надёжного мастера за 5 секунд.",
    cta: "Вызвать мастера",
    tapToTalk: "Нажмите, чтобы говорить",
    servicesEyebrow: "Услуги",
    servicesTitle: "Популярные услуги",
    servicesSub: "Специалист для любой домашней задачи в пару нажатий.",
    callMaster: "Вызвать мастера",
    howEyebrow: "Процесс",
    howTitle: "Как это работает?",
    howSub: "Три простых шага: вы говорите, ИИ выбирает, мастер приезжает.",
    aiBadge: "Умный поиск",
    aiTitle: "Как помогает AI-агент?",
    aiSubtitle: "Самое быстрое, выгодное и качественное решение через ИИ.",
    mastersEyebrow: "Для мастеров",
    mastersTitle: "Вы мастер? Клиенты найдут вас сами",
    mastersDesc: "Новые заказы без рекламы, репутация через рейтинг и все ваши работы в одном месте.",
    mastersCta: "Стать мастером",
    pilotEyebrow: "Регионы",
    pilotTitle: "Запускаемся в первых регионах",
    soon: "Скоро",
    live: "Работает",
    faqTitle: "Часто задаваемые вопросы",
    finalTitle: "Не ждите, пока проблема вырастет. Найдите мастера сейчас.",
    finalDesc: "Одна кнопка, несколько секунд, и подходящий мастер уже в пути.",
  },
  en: {
    badge: "New AI-powered search",
    heroTitle1: "A smarter way to",
    heroHighlight: "find",
    heroTitle2: "a master",
    heroDesc: "The Epchil AI agent finds the best master at the fastest time and the most affordable price.",
    aiCardText: "Describe the problem and the AI finds the best-value, trusted master in 5 seconds.",
    cta: "Book a master",
    tapToTalk: "Tap to speak",
    servicesEyebrow: "Services",
    servicesTitle: "Popular services",
    servicesSub: "An expert for any home problem in just a few taps.",
    callMaster: "Book now",
    howEyebrow: "Process",
    howTitle: "How it works",
    howSub: "Three simple steps: you describe, AI matches, the master arrives.",
    aiBadge: "Smart search",
    aiTitle: "How does the AI agent help you?",
    aiSubtitle: "The fastest, most affordable and highest-quality solution, powered by AI.",
    mastersEyebrow: "For masters",
    mastersTitle: "Are you a master? Clients will find you",
    mastersDesc: "New orders without advertising, reputation through ratings, and all your jobs in one place.",
    mastersCta: "Join as a master",
    pilotEyebrow: "Regions",
    pilotTitle: "Launching in our first regions",
    soon: "Coming soon",
    live: "Live",
    faqTitle: "Frequently asked questions",
    finalTitle: "Don't let the problem wait. Find a master now.",
    finalDesc: "One button, a few seconds, and the right master is on the way.",
  },
};

const services: { key: string; cat: string; icon: typeof Wrench; color: string; bg: string; name: L3; desc: L3 }[] = [
  { key: "s1", cat: "santexnik", icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/10",
    name: { uz: "Santexnik", ru: "Сантехник", en: "Plumber" },
    desc: { uz: "Quvur, kran va suv tizimlari", ru: "Трубы, краны и водоснабжение", en: "Pipes, taps and water systems" } },
  { key: "s2", cat: "elektrik", icon: Bolt, color: "text-yellow-500", bg: "bg-yellow-500/10",
    name: { uz: "Elektrik", ru: "Электрик", en: "Electrician" },
    desc: { uz: "Rozetka, sim va yoritish ishlari", ru: "Проводка, розетки, освещение", en: "Wiring, sockets and lighting" } },
  { key: "s3", cat: "kafelchi", icon: Grid3x3, color: "text-purple-500", bg: "bg-purple-500/10",
    name: { uz: "Kafelchi", ru: "Плиточник", en: "Tiler" },
    desc: { uz: "Hammom va oshxona kafel ishlari", ru: "Плитка в ванной и на кухне", en: "Bathroom and kitchen tiling" } },
  { key: "s4", cat: "maishiy", icon: WashingMachine, color: "text-orange-500", bg: "bg-orange-500/10",
    name: { uz: "Maishiy texnika", ru: "Бытовая техника", en: "Appliances" },
    desc: { uz: "Kir yuvish mashinasi va pech ta'miri", ru: "Ремонт стиралки и духовки", en: "Washer and oven repair" } },
  { key: "s5", cat: "romchi", icon: AppWindow, color: "text-sky-500", bg: "bg-sky-500/10",
    name: { uz: "Romchi", ru: "Оконщик", en: "Window fitter" },
    desc: { uz: "Plastik romlar va deraza sozlash", ru: "Пластиковые окна и регулировка", en: "PVC windows and adjustment" } },
  { key: "s6", cat: "tozalovchi", icon: SprayCan, color: "text-emerald-500", bg: "bg-emerald-500/10",
    name: { uz: "Tozalash", ru: "Уборка", en: "Cleaning" },
    desc: { uz: "Kvartira va ofis tozalash", ru: "Уборка квартир и офисов", en: "Home and office cleaning" } },
  { key: "s7", cat: "konditsioner", icon: AirVent, color: "text-cyan-500", bg: "bg-cyan-500/10",
    name: { uz: "Konditsioner", ru: "Кондиционеры", en: "Air conditioning" },
    desc: { uz: "O'rnatish va xizmat ko'rsatish", ru: "Установка и обслуживание", en: "Installation and servicing" } },
  { key: "s8", cat: "duradgor", icon: Hammer, color: "text-amber-600", bg: "bg-amber-600/10",
    name: { uz: "Duradgor", ru: "Плотник", en: "Carpenter" },
    desc: { uz: "Mebel va eshik-deraza ishlari", ru: "Мебель, двери и столярные работы", en: "Furniture, doors and woodwork" } },
];

const steps: { icon: typeof Mic; title: L3; text: L3 }[] = [
  {
    icon: MessageSquareText,
    title: { uz: "Buyurtma berasiz", ru: "Оставляете заявку", en: "You describe the problem" },
    text: {
      uz: "Matn yozing yoki mikrofon tugmasini bosing. O'zbek, rus yoki ingliz tilida.",
      ru: "Напишите текстом или нажмите на микрофон. На узбекском, русском или английском.",
      en: "Type, or tap the microphone. In Uzbek, Russian or English.",
    },
  },
  {
    icon: BrainCircuit,
    title: { uz: "AI eng mos ustani tanlaydi", ru: "AI выбирает лучшего мастера", en: "AI picks the best master" },
    text: {
      uz: "Masofa, reyting, narx va band emasligi bo'yicha ustalar saralanadi.",
      ru: "Мастера ранжируются по расстоянию, рейтингу, цене и занятости.",
      en: "Masters are ranked by distance, rating, price and availability.",
    },
  },
  {
    icon: CheckCircle2,
    title: { uz: "Usta keladi, muammo hal bo'ladi", ru: "Мастер приезжает и решает проблему", en: "The master arrives and fixes it" },
    text: {
      uz: "Buyurtmani kuzatasiz, ishdan keyin baho berasiz.",
      ru: "Следите за заказом и оцените работу после завершения.",
      en: "Track the order and rate the work when it is done.",
    },
  },
];

const aiPoints: { icon: typeof Clock3; title: L3; text: L3 }[] = [
  { icon: Clock3,
    title: { uz: "Vaqtni tejash", ru: "Экономия времени", en: "Saves time" },
    text: { uz: "Usta kelish vaqtini oldindan hisoblab beradi.", ru: "Заранее оценивает время прибытия мастера.", en: "Estimates the master's arrival time up front." } },
  { icon: WalletCards,
    title: { uz: "Hamyonbop narxlar", ru: "Выгодные цены", en: "Fair prices" },
    text: { uz: "Ustalarni taqqoslab eng maqbul variantni topadi.", ru: "Сравнивает мастеров и находит лучший вариант.", en: "Compares masters and finds the best-value option." } },
  { icon: ShieldCheck,
    title: { uz: "Sifat kafolati", ru: "Гарантия качества", en: "Quality assurance" },
    text: { uz: "Yuqori reytingli, tekshirilgan ustalar tavsiya etiladi.", ru: "Рекомендуются проверенные мастера с высоким рейтингом.", en: "Only verified, highly rated masters are recommended." } },
  { icon: MapPin,
    title: { uz: "Eng yaqin usta", ru: "Ближайший мастер", en: "Nearest master" },
    text: { uz: "Sizga eng yaqin joylashgan ustalarni darhol aniqlaydi.", ru: "Мгновенно находит ближайших к вам специалистов.", en: "Instantly finds the specialists closest to you." } },
];

const stats: { icon: typeof Clock3; value: string; label: L3 }[] = [
  { icon: Sparkles, value: "5 s", label: { uz: "AI tahlil vaqti", ru: "Время анализа ИИ", en: "AI analysis time" } },
  { icon: InfinityIcon, value: "24/7", label: { uz: "Doimiy xizmat", ru: "Круглосуточно", en: "Always available" } },
  { icon: Languages, value: "UZ · RU · EN", label: { uz: "Uch tilda", ru: "На трёх языках", en: "Three languages" } },
  { icon: Gift, value: "0 so'm", label: { uz: "Hozircha bepul", ru: "Пока бесплатно", en: "Free for now" } },
];

const masterBenefits: { icon: typeof Clock3; text: L3 }[] = [
  { icon: BellRing, text: { uz: "Yangi buyurtmalar haqida darhol xabar", ru: "Мгновенные уведомления о новых заказах", en: "Instant alerts for new orders" } },
  { icon: TrendingUp, text: { uz: "Reyting orqali obro' va qayta buyurtmalar", ru: "Репутация и повторные заказы через рейтинг", en: "Reputation and repeat orders through ratings" } },
  { icon: BadgeCheck, text: { uz: "Tekshirilgan profil belgisi", ru: "Значок проверенного профиля", en: "Verified-profile badge" } },
  { icon: Handshake, text: { uz: "Reklama xarajatisiz yangi mijozlar", ru: "Новые клиенты без затрат на рекламу", en: "New clients with no ad spend" } },
];

const regions: { name: L3; live: boolean }[] = [
  { name: { uz: "Samarqand", ru: "Самарканд", en: "Samarkand" }, live: true },
  { name: { uz: "Qashqadaryo", ru: "Кашкадарья", en: "Kashkadarya" }, live: true },
  { name: { uz: "Toshkent", ru: "Ташкент", en: "Tashkent" }, live: false },
  { name: { uz: "Buxoro", ru: "Бухара", en: "Bukhara" }, live: false },
  { name: { uz: "Farg'ona", ru: "Фергана", en: "Fergana" }, live: false },
];

const faqs = {
  uz: [
    ["Ustalar qanday tekshiriladi?", "Barcha ustalar ro'yxatdan o'tish jarayonida shaxsini tasdiqlaydi, mutaxassislik ma'lumotlari va oldingi ish tajribasi ko'rib chiqiladi."],
    ["AI agent qanday ishlaydi?", "Muammongizni aytishingiz bilan AI kasbni, hududni va shoshilinchlikni aniqlaydi, so'ng ustalarning reytingi, narxi va joylashuvini taqqoslab eng maqbulini tavsiya qiladi."],
    ["Narxlar qanday belgilanadi?", "Platformadagi o'rtacha narxlar asosida AI taxminiy narxni hisoblaydi, yakuniy narx ish hajmiga qarab usta kelganda tasdiqlanadi."],
    ["Kechasi ham xizmat bormi?", "Ha, platforma 24/7 ishlaydi va navbatchi ustalar mavjud."],
    ["Agar usta yoqmasa-chi?", "Muammo yuzaga kelsa, boshqa usta tavsiya qilinadi va qo'llab-quvvatlash jamoasi yordam beradi."],
  ],
  ru: [
    ["Как проверяются мастера?", "При регистрации мастера подтверждают личность, мы изучаем специализацию и предыдущий опыт работы."],
    ["Как работает AI-агент?", "Вы описываете проблему, ИИ определяет профессию, район и срочность, затем сравнивает рейтинг, цены и локацию мастеров и предлагает лучшего."],
    ["Как формируются цены?", "ИИ рассчитывает примерную стоимость на основе средних цен платформы, точная цена утверждается после осмотра мастером."],
    ["Есть ли услуги ночью?", "Да, платформа работает 24/7, есть дежурные мастера."],
    ["Что делать, если мастер не подошёл?", "Система предложит другого специалиста, а поддержка оперативно поможет."],
  ],
  en: [
    ["How are masters verified?", "Masters confirm their identity at sign-up, and we review their specialization and past work experience."],
    ["How does the AI agent work?", "Once you describe the problem, the AI identifies the trade, area and urgency, then compares ratings, prices and locations to recommend the best match."],
    ["How are prices set?", "The AI estimates a price from platform averages; the final price is confirmed by the master on site based on the scope of work."],
    ["Is service available at night?", "Yes, the platform runs 24/7 and on-duty masters are available."],
    ["What if I don't like the master?", "We will recommend another master and the support team will help right away."],
  ],
};

/* ───────────────────────── Motion presets ───────────────────────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } },
};

function SectionHead({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <motion.div variants={fadeUp} className="mb-12 sm:mb-16 text-center">
      {eyebrow && (
        <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#F97316]">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl text-balance">{title}</h2>
      {sub && <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-400">{sub}</p>}
      <div className="divider-ornament mx-auto mt-6 w-40 opacity-80" aria-hidden="true" />
    </motion.div>
  );
}

/* ───────────────────────── Page ───────────────────────── */
export default function HomePage() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const t = pick(locale, dict);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiOpened, setAiOpened] = useState(false);

  const openAi = () => {
    setAiOpened(true);
    setIsAiModalOpen(true);
  };

  // Signed-in users go straight to onboarding/profile; guests get the sign-in modal.
  const joinAsMaster = () => {
    if (user) router.push("/onboarding");
    else window.dispatchEvent(new Event("epchil:open-auth"));
  };

  const chatMock: { from: "user" | "ai"; text: L3 }[] = [
    { from: "user", text: { uz: "Uyimdagi kran yorilib ketdi!", ru: "У меня прорвало кран!", en: "My kitchen tap burst!" } },
    { from: "ai", text: { uz: "Santexnik, shoshilinch. Eng yaqin usta: 1,2 km, reyting 4.9.", ru: "Сантехник, срочно. Ближайший мастер: 1,2 км, рейтинг 4.9.", en: "Plumber, urgent. Nearest master: 1.2 km, rating 4.9." } },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-slate-950 font-sans selection:bg-[#F97316]/30">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 px-4 pb-20 pt-16 sm:pb-28 sm:pt-24 sm:px-6 lg:px-8">
        <div className="pattern-star mask-fade absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] max-w-none -translate-x-1/2 rounded-full bg-gradient-to-b from-[#F97316]/10 via-blue-500/5 to-transparent blur-[120px] pointer-events-none" aria-hidden="true" />
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none dark:bg-blue-500/10" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl pointer-events-none dark:bg-orange-500/10" aria-hidden="true" />

        {/* Floating decorative icons */}
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
          <Wrench className="animate-drift absolute left-[8%] top-[22%] text-blue-500/30" size={44} />
          <Bolt className="animate-drift-slow absolute right-[9%] top-[18%] text-yellow-500/40" size={40} />
          <Droplets className="animate-drift-slow absolute left-[12%] bottom-[18%] text-sky-500/30" size={38} />
          <Hammer className="animate-drift absolute right-[11%] bottom-[22%] text-orange-500/30" size={42} />
          <Star className="animate-drift absolute left-[30%] top-[10%] text-[#F97316]/30" size={22} />
          <Sparkles className="animate-drift-slow absolute right-[28%] bottom-[10%] text-blue-500/30" size={26} />
        </div>

        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="relative z-10 mx-auto max-w-4xl text-center"
        >
          <motion.div variants={fadeUp} className="mb-8 inline-flex items-center rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-4 py-1.5 text-sm font-semibold text-[#F97316]">
            <Sparkles size={16} className="mr-2 animate-pulse" />
            {t.badge}
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-7xl text-balance">
            {t.heroTitle1}{" "}
            <span className="bg-gradient-to-r from-[#1A365D] to-[#F97316] bg-clip-text text-transparent dark:from-blue-400 dark:to-orange-400">
              {t.heroHighlight}
            </span>{" "}
            {t.heroTitle2}
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-lg md:text-xl text-pretty">
            {t.heroDesc}
          </motion.p>

          {/* AI Card */}
          <motion.div variants={scaleIn} className="relative mx-auto mt-12 max-w-2xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#1A365D]/10 to-[#F97316]/10 blur-2xl dark:from-blue-500/10 dark:to-orange-500/10" />
            <div className="relative rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80 dark:shadow-black/30 sm:p-10">
              <p className="mb-8 text-center text-base font-medium text-slate-700 dark:text-slate-200 sm:text-lg">
                {t.aiCardText}
              </p>

              <button
                type="button"
                onClick={openAi}
                aria-label={t.tapToTalk}
                className="group relative mx-auto block h-24 w-24 sm:h-28 sm:w-28 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#F97316]/50"
              >
                <span className="ring-pulse absolute inset-0" aria-hidden="true" />
                <span className="absolute inset-0 rounded-full bg-[#F97316] opacity-30 blur-xl transition-opacity duration-500 group-hover:opacity-60" aria-hidden="true" />
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#1A365D] to-[#F97316] shadow-xl dark:border-slate-950"
                >
                  <Mic size={40} className="text-white drop-shadow-lg" />
                </motion.span>
              </button>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Bot size={14} /> Epchil AI Agent · {t.tapToTalk}
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/booking" className="w-full sm:w-auto">
              <Button className="shimmer h-14 w-full rounded-2xl bg-gradient-to-r from-[#1A365D] to-[#F97316] px-10 text-lg font-bold text-white shadow-xl shadow-orange-500/20 transition-all duration-300 hover:from-[#1A365D]/90 hover:to-[#F97316]/90 hover:shadow-2xl hover:shadow-orange-500/30 sm:w-auto">
                {t.cta}
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ STATS STRIP ═══════════ */}
      <section className="relative border-y border-slate-100 bg-white px-4 py-10 dark:border-slate-900 dark:bg-slate-950 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}
          className="mx-auto grid max-w-6xl grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.value}
                variants={fadeUp}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:gap-4 sm:p-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/10 text-[#F97316] sm:h-12 sm:w-12">
                  <Icon size={22} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-slate-900 dark:text-white sm:text-xl">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{s.label[locale]}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ═══════════ SERVICE MARQUEE ═══════════ */}
      <section className="marquee relative overflow-hidden border-b border-slate-100 bg-slate-50 py-5 dark:border-slate-900 dark:bg-slate-900/40" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <ul key={dup} className="flex shrink-0 items-center gap-4 pr-4">
              {services.map((svc) => {
                const Icon = svc.icon;
                return (
                  <li
                    key={`${dup}-${svc.key}`}
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <Icon size={16} className={svc.color} /> {svc.name[locale]}
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </section>

      {/* ═══════════ SERVICES ═══════════ */}
      <section className="relative overflow-hidden bg-white px-4 py-20 dark:bg-slate-950 sm:px-6 sm:py-24 lg:px-8">
        <div className="pattern-dots mask-fade absolute inset-0 opacity-60" aria-hidden="true" />
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}
          className="relative mx-auto max-w-7xl"
        >
          <SectionHead eyebrow={t.servicesEyebrow} title={t.servicesTitle} sub={t.servicesSub} />

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <motion.div key={svc.key} variants={fadeUp} whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}>
                  <Link
                    href={`/booking?search=${svc.cat}`}
                    className="group relative block h-full overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-50 p-6 transition-shadow duration-300 hover:shadow-2xl hover:shadow-[#1A365D]/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-blue-900/10 sm:p-8"
                  >
                    <div className={`absolute right-0 top-0 h-32 w-32 rounded-bl-full ${svc.bg} opacity-50 transition-transform duration-500 group-hover:scale-125`} />
                    <div className={`relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 dark:border-slate-800 dark:bg-slate-950 sm:mb-6 sm:h-16 sm:w-16 ${svc.color}`}>
                      <Icon size={30} />
                    </div>
                    <h3 className="relative mb-2 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{svc.name[locale]}</h3>
                    <p className="relative text-sm leading-relaxed text-slate-500 dark:text-slate-400">{svc.desc[locale]}</p>
                    <div className="relative mt-4 flex items-center text-sm font-semibold text-[#F97316] transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
                      {t.callMaster} <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 px-4 py-20 dark:from-slate-950 dark:to-slate-900 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mx-auto max-w-6xl"
        >
          <SectionHead eyebrow={t.howEyebrow} title={t.howTitle} sub={t.howSub} />

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Steps */}
            <ol className="relative space-y-5">
              <div className="absolute bottom-6 left-[34px] top-6 hidden w-0.5 bg-gradient-to-b from-[#F97316]/60 via-slate-300 to-transparent dark:via-slate-700 sm:block" aria-hidden="true" />
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.li
                    key={i}
                    variants={fadeUp}
                    whileHover={{ x: 6 }}
                    className="relative flex gap-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:gap-5 sm:p-5"
                  >
                    <div className="relative z-10 flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F97316] to-orange-500 text-white shadow-lg shadow-orange-500/20">
                      <Icon size={26} />
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                        {i + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title[locale]}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.text[locale]}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>

            {/* Chat mockup */}
            <motion.div variants={scaleIn} className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#F97316]/20 via-transparent to-blue-500/20 blur-2xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1A365D] to-[#F97316] text-white">
                    <Bot size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Epchil AI</p>
                    <p className="flex items-center gap-1 text-xs text-emerald-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> online
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#1A365D] px-4 py-3 text-sm text-white"
                  >
                    {chatMock[0].text[locale]}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                    className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {chatMock[1].text[locale]}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                    className="flex items-center gap-3 rounded-2xl border border-[#F97316]/30 bg-[#F97316]/5 p-3"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A365D] font-bold text-white">J</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                        Jahongir R. <BadgeCheck size={14} className="text-blue-500" />
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" /> 4.9 · 1.2 km
                      </p>
                    </div>
                    <span className="rounded-xl bg-[#F97316] px-3 py-2 text-xs font-bold text-white">96%</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ AI BENEFITS ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50/50 to-orange-50/30 py-20 dark:from-[#0B1120] dark:via-slate-900 dark:to-slate-950 sm:py-24">
        <div className="pattern-star mask-fade absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute right-20 top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-[100px] dark:bg-blue-500/10" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-20 left-20 h-72 w-72 rounded-full bg-orange-400/10 blur-[100px] dark:bg-orange-500/10" aria-hidden="true" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <motion.div variants={fadeUp} className="mb-12 text-center sm:mb-16">
            <span className="mb-6 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
              <BrainCircuit className="mr-2 inline" size={16} /> {t.aiBadge}
            </span>
            <h2 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white md:text-5xl text-balance">{t.aiTitle}</h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">{t.aiSubtitle}</p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {aiPoints.map((pt) => {
              const Icon = pt.icon;
              return (
                <motion.div
                  key={pt.title.en}
                  variants={fadeUp}
                  whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
                  className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-colors duration-300 hover:bg-white hover:shadow-lg dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-slate-700/50 dark:text-blue-400">
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{pt.title[locale]}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{pt.text[locale]}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ═══════════ FOR MASTERS ═══════════ */}
      <section className="relative overflow-hidden bg-white px-4 py-20 dark:bg-slate-950 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1A365D] via-[#16294a] to-[#0F1F3D] p-8 text-white shadow-2xl sm:p-12 lg:p-16"
        >
          <div className="pattern-star absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#F97316]/30 blur-[90px]" aria-hidden="true" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <motion.span variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                <UserCheck size={14} /> {t.mastersEyebrow}
              </motion.span>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold leading-tight sm:text-4xl text-balance">{t.mastersTitle}</motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-base text-slate-300 sm:text-lg">{t.mastersDesc}</motion.p>
              <motion.div variants={fadeUp} className="mt-8">
                <Button
                  onClick={joinAsMaster}
                  className="h-12 rounded-xl bg-[#F97316] px-7 font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-500"
                >
                  {t.mastersCta} <ArrowRight className="ml-2" size={18} />
                </Button>
              </motion.div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {masterBenefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.li
                    key={i}
                    variants={fadeUp}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/20 text-orange-300">
                      <Icon size={20} />
                    </span>
                    <span className="text-sm font-medium leading-snug text-slate-100">{b.text[locale]}</span>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ REGIONS ═══════════ */}
      <section className="bg-slate-50 px-4 py-16 dark:bg-slate-900/40 sm:px-6 sm:py-20 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mx-auto max-w-5xl"
        >
          <SectionHead eyebrow={t.pilotEyebrow} title={t.pilotTitle} />
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {regions.map((r) => (
              <motion.div
                key={r.name.en}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm sm:px-5 ${
                  r.live
                    ? "border-[#F97316]/40 bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                    : "border-slate-200 bg-white/60 text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400"
                }`}
              >
                {r.live ? <MapPin size={16} className="text-[#F97316]" /> : <Hourglass size={16} />}
                {r.name[locale]}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  r.live ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {r.live ? t.live : t.soon}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="bg-white py-20 dark:bg-slate-950 sm:py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"
        >
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t.faqTitle}</h2>
            <div className="divider-ornament mx-auto mt-5 w-40 opacity-80" aria-hidden="true" />
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {pick(locale, faqs).map(([q, a], i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-5 transition-colors data-[state=open]:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:data-[state=open]:bg-slate-900 sm:px-6"
              >
                <AccordionTrigger className="py-5 text-left font-bold text-slate-800 hover:no-underline dark:text-slate-200 sm:py-6">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 leading-relaxed text-slate-600 dark:text-slate-400">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#1A365D] to-[#F97316] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="pattern-star absolute inset-0 opacity-40" aria-hidden="true" />
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="relative mx-auto max-w-3xl text-center text-white"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-extrabold sm:text-4xl text-balance">{t.finalTitle}</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-base text-white/85 sm:text-lg">{t.finalDesc}</motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={openAi}
              className="shimmer h-13 w-full rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-[#1A365D] shadow-xl hover:bg-slate-100 sm:w-auto"
            >
              <Mic size={18} className="mr-2" /> {t.tapToTalk}
            </Button>
            <Link href="/booking" className="w-full sm:w-auto">
              <Button variant="outline" className="h-13 w-full rounded-2xl border-white/60 bg-transparent px-8 py-3.5 text-base font-bold text-white hover:bg-white/10 sm:w-auto">
                {t.cta} <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {aiOpened && <AiModal isOpen={isAiModalOpen} setIsOpen={setIsAiModalOpen} />}
    </div>
  );
}
