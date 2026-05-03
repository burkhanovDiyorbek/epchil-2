"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Bolt,
  CheckCircle2,
  Clock3,
  Drill,
  Languages,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
  Wrench,
  ChevronDown,
  BrainCircuit,
  Zap,
  ArrowRight,
  Mic
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { AiModal } from "@/components/ai-modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";

const dictionaries = {
  uz: {
    login: "Kirish",
    heroTitle: "Uy ishlari endi muammo emas!",
    heroDesc:
      "Epchil AI agenti eng yaxshi ustani eng qisqa fursatda va eng arzon narxda topib beradi.",
    cta: "Usta chaqirish",
    servicesTitle: "Ommabop xizmatlar",
    howTitle: "Qanday ishlaydi?",
    aiTitle: "AI agent sizga qanday yordam beradi?",
    aiSubtitle: "Eng tez, eng arzon va eng sifatli yechim - sun'iy intellekt orqali.",
    aiBadge: "Aqlli izlash",
    testimonialsTitle: "Mijozlar fikri",
    faqTitle: "Ko'p so'raladigan savollar",
    footerTitle: "Usta chaqirish platformasi",
  },
  ru: {
    login: "Войти",
    heroTitle: "Домашние задачи больше не проблема!",
    heroDesc:
      "AI-агент Epchil подбирает лучшего мастера по цене, скорости и рейтингу за считанные минуты.",
    cta: "Вызвать мастера",
    servicesTitle: "Популярные услуги",
    howTitle: "Как это работает?",
    aiTitle: "Как помогает AI-агент?",
    aiSubtitle: "Самое быстрое, дешевое и качественное решение через ИИ.",
    aiBadge: "Умный поиск",
    testimonialsTitle: "Отзывы клиентов",
    faqTitle: "Часто задаваемые вопросы",
    footerTitle: "Платформа вызова мастеров",
  },
};

const services = [
  { key: "s1", icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10", uz: ["Santexnik", "Quvur, kran va suv tizimlari"], ru: ["Сантехник", "Трубы, краны и водоснабжение"] },
  { key: "s2", icon: Bolt, color: "text-yellow-500", bg: "bg-yellow-500/10", uz: ["Elektrik", "Rozetka, sim va yoritish ishlari"], ru: ["Электрик", "Проводка, розетки, освещение"] },
  { key: "s3", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10", uz: ["Kafelchi", "Hammom va oshxona kafel ishlari"], ru: ["Плиточник", "Плиточные работы в ванной и кухне"] },
  { key: "s4", icon: Drill, color: "text-orange-500", bg: "bg-orange-500/10", uz: ["Maishiy texnika", "Kir yuvish mashinasi va pech ta'miri"], ru: ["Бытовая техника", "Ремонт стиралки и духовки"] },
];

const steps = {
  uz: ["Buyurtma berasiz", "AI eng mos ustani tanlaydi", "Usta keladi va muammo hal bo'ladi"],
  ru: ["Оставляете заявку", "AI выбирает лучшего мастера", "Мастер приезжает и решает проблему"],
};

const aiPoints = {
  uz: [
    { icon: Clock3, title: "Vaqtni tejash", text: "Usta kelish vaqtini daqiqasigacha aniq prognoz qiladi." },
    { icon: WalletCards, title: "Arzon narxlar", text: "Barcha ustalarni taqqoslab eng hamyonbob variantni topadi." },
    { icon: ShieldCheck, title: "Sifat kafolati", text: "Faqat yuqori reytingli, tekshirilgan ustalar tavsiya etiladi." },
    { icon: MapPin, title: "Lokatsiya", text: "Sizga eng yaqin joylashgan ustalarni darhol aniqlaydi." },
  ],
  ru: [
    { icon: Clock3, title: "Экономия времени", text: "Точно прогнозирует время прибытия мастера." },
    { icon: WalletCards, title: "Низкие цены", text: "Сравнивает всех и находит самый выгодный вариант." },
    { icon: ShieldCheck, title: "Гарантия качества", text: "Рекомендуются только проверенные мастера с высоким рейтингом." },
    { icon: MapPin, title: "Локация", text: "Мгновенно находит ближайших к вам специалистов." },
  ],
};

const testimonials = {
  uz: [
    ["Malika T.", "20 daqiqada usta topildi, narx ham qulay bo'ldi.", 5],
    ["Jasur R.", "Elektrik vaqtida keldi, ishni toza yakunladi.", 5],
    ["Nodira A.", "AI tavsiya qilgan usta juda professional ekan.", 4],
  ],
  ru: [
    ["Малика Т.", "Мастера нашли за 20 минут, цена отличная.", 5],
    ["Жасур Р.", "Электрик приехал вовремя и аккуратно всё сделал.", 5],
    ["Нодира А.", "Мастер, предложенный AI, оказался очень профессиональным.", 4],
  ],
};

const faqs = {
  uz: [
    ["Ustalar qanday tekshiriladi?", "Barcha ustalarimiz ro'yxatdan o'tish jarayonida pasport, mutaxassislik sertifikatlari va oldingi ish tajribalari tekshiruvidan o'tadi."],
    ["AI agent qanday ishlaydi?", "Muammongizni aytishingiz bilan AI minglab ustalarning reytingi, narxi va joylashuvini bir necha soniyada tahlil qilib, eng optimalini topadi."],
    ["Narxlar qanday belgilanadi?", "Platformadagi o'rtacha narxlar asosida AI oldindan taxminiy narxni hisoblaydi, yakuniy narx esa ish hajmiga qarab usta kelganda tasdiqlanadi."],
    ["Kechasi ham xizmat bormi?", "Albatta, platformada 24/7 rejimida ishlaydigan navbatchi ustalar mavjud."],
    ["Agar usta yoqmasa-chi?", "Muammo yuzaga kelsa, zudlik bilan boshqa usta tavsiya qilinadi va qo'llab-quvvatlash jamoasi yordam beradi."],
  ],
  ru: [
    ["Как проверяются мастера?", "Все мастера проходят проверку паспортных данных, сертификатов квалификации и предыдущего опыта работы."],
    ["Как работает AI-агент?", "Вы описываете проблему, а ИИ за секунды анализирует рейтинг, цены и локацию тысяч мастеров, предлагая лучшего."],
    ["Как формируются цены?", "ИИ рассчитывает примерную стоимость на основе средних цен платформы, точная цена утверждается после осмотра мастером."],
    ["Есть ли услуги ночью?", "Конечно, на платформе есть дежурные мастера, работающие 24/7."],
    ["Что делать, если мастер не подошел?", "При возникновении проблем система предложит другого специалиста, а поддержка оперативно поможет."],
  ],
};

const contacts = {
  uz: { title: "Aloqa", address: "Toshkent, O'zbekiston" },
  ru: { title: "Контакты", address: "Ташкент, Узбекистан" },
};

// Motion Variants
const fadeUpVar = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerVar = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function HomePage() {
  const { locale, setLocale } = useLanguage();
  const t = useMemo(() => dictionaries[locale], [locale]);
  const socials = ["Telegram", "Instagram", "Facebook"];
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-[#F97316]/30">
      {/* HEADER */}
      <header className="fixed top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2 text-2xl font-bold text-[#1A365D] dark:text-blue-200">
            <div className="bg-gradient-to-br from-[#F97316] to-orange-500 text-white p-1.5 rounded-xl shadow-lg shadow-orange-500/20">
              <Bolt size={24} />
            </div>
            Epchil
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="relative hidden sm:block">
              <Languages className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                className="h-10 appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-9 pr-8 text-sm outline-none cursor-pointer hover:border-[#F97316] transition-colors focus:ring-2 focus:ring-[#F97316]/20"
                value={locale}
                onChange={(e) => setLocale(e.target.value as "uz" | "ru")}
                aria-label="Tilni tanlang"
              >
                <option value="uz">UZ</option>
                <option value="ru">RU</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-6 font-semibold shadow-md">
                {t.login}
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* HERO & AI SMART MATCH */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 px-4 py-20 sm:px-6 lg:px-8">
          {/* Abstract background shapes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#F97316]/10 via-blue-500/5 to-transparent rounded-full blur-[100px] -z-10 pointer-events-none" />
          
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerVar}
            className="mx-auto max-w-4xl text-center z-10 relative"
          >
            <motion.div variants={fadeUpVar} className="inline-flex items-center rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-4 py-1.5 text-sm font-semibold text-[#F97316] mb-8">
              <Sparkles size={16} className="mr-2 animate-pulse" />
              {locale === "uz" ? "Yangi AI qidiruv tizimi" : "Новая система поиска с ИИ"}
            </motion.div>
            
            <motion.h1 variants={fadeUpVar} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              {locale === "uz" ? (
                <>Usta topishning <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A365D] to-[#F97316] dark:from-blue-400 dark:to-orange-400">aqlli</span> usuli</>
              ) : (
                <>Умный способ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A365D] to-[#F97316] dark:from-blue-400 dark:to-orange-400">найти</span> мастера</>
              )}
            </motion.h1>
            
            <motion.p variants={fadeUpVar} className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t.heroDesc}
            </motion.p>

            {/* AI SMART MATCH BLOCK */}
            <motion.div variants={fadeUpVar} className="mt-12 relative max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A365D]/10 to-[#F97316]/10 dark:from-blue-500/10 dark:to-orange-500/10 blur-2xl rounded-3xl"></div>
              <div className="relative glass-card border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center">
                <p className="text-slate-800 dark:text-slate-200 font-medium text-lg mb-6 text-center">
                  {locale === "uz" ? "Muammoni ayting, AI sizga eng arzon va ishonchli ustani 5 soniyada topib beradi." : "Скажите проблему, ИИ найдет самого дешевого и надежного мастера за 5 секунд."}
                </p>
                
                <div className="relative group cursor-pointer" onClick={() => router.push('/booking')}>
                  <div className="absolute inset-0 bg-[#F97316] rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity animate-pulse"></div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#1A365D] to-[#F97316] flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-950"
                  >
                    <Mic size={40} className="text-white" />
                  </motion.div>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 font-medium flex items-center gap-1">
                  <Bot size={14} /> Epchil AI Agent
                </p>
              </div>
            </motion.div>

          </motion.div>
        </section>

        {/* SERVICES SECTION */}
        <section className="bg-white dark:bg-slate-950 px-4 py-24 sm:px-6 lg:px-8 border-y border-slate-100 dark:border-slate-900">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerVar}
            className="mx-auto max-w-7xl"
          >
            <motion.div variants={fadeUpVar} className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                {t.servicesTitle}
              </h2>
              <div className="mt-4 h-1.5 w-16 bg-gradient-to-r from-[#1A365D] to-[#F97316] mx-auto rounded-full"></div>
            </motion.div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.key}
                    variants={fadeUpVar}
                    whileHover={{ y: -8 }}
                    className="group relative bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800 transition-all hover:shadow-2xl hover:shadow-[#1A365D]/5 dark:hover:shadow-blue-900/10 overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${service.bg} rounded-bl-full -z-10 transition-transform group-hover:scale-110 opacity-50`}></div>
                    <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 ${service.color} transition-transform group-hover:rotate-6`}>
                      <Icon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {locale === "uz" ? service.uz[0] : service.ru[0]}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {locale === "uz" ? service.uz[1] : service.ru[1]}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="px-4 py-24 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={staggerVar}
            className="mx-auto max-w-6xl"
          >
            <motion.div variants={fadeUpVar} className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {t.howTitle}
              </h2>
            </motion.div>
            
            <div className="grid gap-8 md:grid-cols-3 relative">
              <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent -translate-y-1/2 z-0"></div>
              {steps[locale].map((step, index) => (
                <motion.div key={step} variants={fadeUpVar} className="relative z-10 flex flex-col items-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-2xl font-bold text-[#F97316] shadow-xl border-4 border-slate-50 dark:border-slate-900">
                    0{index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center px-4">{step}</h3>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* AI BENEFITS SECTION */}
        <section className="bg-[#0B1120] py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={staggerVar}
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10"
          >
            <motion.div variants={fadeUpVar} className="text-center mb-16">
              <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold mb-6 border border-blue-500/20">
                <BrainCircuit className="inline mr-2" size={16}/> {t.aiBadge}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                {t.aiTitle}
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                {t.aiSubtitle}
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiPoints[locale].map((point, idx) => {
                const Icon = point.icon;
                return (
                  <motion.div key={point.title} variants={fadeUpVar} whileHover={{ y: -5 }} className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl hover:bg-slate-800/60 transition-colors">
                    <div className="h-14 w-14 rounded-2xl bg-slate-700/50 flex items-center justify-center text-blue-400 mb-6">
                      <Icon size={28} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-3">{point.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{point.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* FAQ SECTION */}
        <section className="bg-white dark:bg-slate-950 py-24">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={fadeUpVar}
            className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {t.faqTitle}
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs[locale].map(([q, a], i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-slate-200 dark:border-slate-800 rounded-2xl px-6 bg-slate-50 dark:bg-slate-900/50 data-[state=open]:bg-white dark:data-[state=open]:bg-slate-900 transition-colors">
                  <AccordionTrigger className="text-left font-bold text-slate-800 dark:text-slate-200 hover:no-underline py-6">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-400 pb-6 leading-relaxed">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 grid gap-12 md:grid-cols-3">
          <div>
            <a href="#" className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white mb-6">
              <Bolt size={24} className="text-[#F97316]" /> Epchil
            </a>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {t.footerTitle}. {locale === "uz" ? "Premium xizmat va zamonaviy texnologiyalar uyg'unligi." : "Сочетание премиум-сервиса и современных технологий."}
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-6">{contacts[locale].title}</h5>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><Bolt size={14}/></span> +998 90 123 45 67</li>
              <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Bot size={14}/></span> hello@epchil.uz</li>
              <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400"><MapPin size={14}/></span> {contacts[locale].address}</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 dark:text-white mb-6">{locale === "uz" ? "Ijtimoiy tarmoqlar" : "Соцсети"}</h5>
            <div className="flex gap-4 mb-8">
              {socials.map((social) => (
                <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} key={social} href="#" className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-[#F97316] hover:text-[#F97316] transition-colors shadow-sm">
                  <span className="text-xs font-semibold">{social[0]}</span>
                </motion.a>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Epchil. {locale === "uz" ? "Barcha huquqlar himoyalangan." : "Все права защищены."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
