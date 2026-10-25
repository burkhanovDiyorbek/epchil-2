"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ArrowRight, Sparkles, Filter, Search, Bolt, Languages, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterCard, Master } from "@/components/booking/MasterCard";
import { FilterSidebar, FilterState } from "@/components/booking/FilterSidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage, tr, SPEECH_LANG } from "@/components/language-provider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMasterRatings } from "@/lib/reviews";

// Demo masters (created from the admin panel) are hidden from the public catalog unless this is "1".
const SHOW_DEMO_MASTERS = process.env.NEXT_PUBLIC_SHOW_DEMO_MASTERS === "1";
import Link from "next/link";

const dictionaries = {
  uz: {
    login: "Kirish",
    aiTitle: "Muammoni yozing yoki ayting,",
    aiTitleHighlight: "AI eng yaxshi ustani",
    aiTitleEnd: "topadi",
    searchPlaceholder: "Masalan: Uyimdagi quvur yorilib ketdi...",
    searchBtn: "Qidirish",
    aiAnalyzing: "AI tahlil qilmoqda...",
    aiFound: "Muammo aniqlandi",
    kasb: "Kasb",
    hudud: "Hudud",
    holat: "Holat",
    catalogTitle: "Ustalar katalogi",
    totalFound: "Jami {n} ta usta topildi",
    notFound: "Hech kim topilmadi",
    notFoundDesc: "Siz izlayotgan shartlarga mos usta topilmadi. Filtrlarni o'zgartirib qayta urinib ko'ring.",
    clearFilters: "Filtrlarni tozalash",
    filterMobile: "Filtrlash",
    open: "Ochish",
    close: "Yopish"
  },
  ru: {
    login: "Войти",
    aiTitle: "Напишите или скажите проблему,",
    aiTitleHighlight: "ИИ найдет лучшего",
    aiTitleEnd: "мастера",
    searchPlaceholder: "Например: Прорвало трубу дома...",
    searchBtn: "Искать",
    aiAnalyzing: "ИИ анализирует...",
    aiFound: "Проблема определена",
    kasb: "Профессия",
    hudud: "Регион",
    holat: "Статус",
    catalogTitle: "Каталог мастеров",
    totalFound: "Всего найдено {n} мастеров",
    notFound: "Никого не найдено",
    notFoundDesc: "Мастера по вашим критериям не найдены. Попробуйте изменить фильтры.",
    clearFilters: "Очистить фильтры",
    filterMobile: "Фильтры",
    open: "Открыть",
    close: "Закрыть"
  },
  en: {
    login: "Sign in",
    aiTitle: "Type or say the problem,",
    aiTitleHighlight: "AI finds the best master",
    aiTitleEnd: "for you",
    searchPlaceholder: "E.g. A pipe burst in my house...",
    searchBtn: "Search",
    aiAnalyzing: "AI is analyzing...",
    aiFound: "Problem identified",
    kasb: "Trade",
    hudud: "Area",
    holat: "Status",
    catalogTitle: "Masters catalog",
    totalFound: "{n} masters found",
    notFound: "Nobody found",
    notFoundDesc: "No masters match your criteria. Try changing the filters.",
    clearFilters: "Clear filters",
    filterMobile: "Filters",
    open: "Open",
    close: "Close"
  }
};


const getSemanticKeywords = (query: string): string[] => {
  const q = query.toLowerCase();
  const matchedCategories: string[] = [];

  if (
    q.includes("quvur") || q.includes("kran") || q.includes("suv") ||
    q.includes("sifon") || q.includes("truba") || q.includes("santexnik") ||
    q.includes("unitaz") || q.includes("dush") || q.includes("vanna") ||
    q.includes("труб") || q.includes("кран") || q.includes("вод") ||
    q.includes("сантех") || q.includes("душ")
  ) {
    matchedCategories.push("santexnik");
  }

  if (
    q.includes("rozetka") || q.includes("sim") || q.includes("tok") ||
    q.includes("chiroq") || q.includes("svet") || q.includes("elektrik") ||
    q.includes("lyustra") || q.includes("montaj") || q.includes("avtomat") ||
    q.includes("электр") || q.includes("розетк") || q.includes("провод") ||
    q.includes("свет") || q.includes("люстр")
  ) {
    matchedCategories.push("elektrik");
  }

  if (
    q.includes("kafel") || q.includes("plitka") || q.includes("kafelchi") ||
    q.includes("mramor") || q.includes("keramika") ||
    q.includes("плитк") || q.includes("кафел") || q.includes("пол")
  ) {
    matchedCategories.push("kafelchi");
  }

  if (
    q.includes("rom") || q.includes("deraza") || q.includes("akfa") ||
    q.includes("plastik") || q.includes("romchi") || q.includes("chivin") ||
    q.includes("oyna") || q.includes("окон") || q.includes("окн") ||
    q.includes("пластик") || q.includes("сетк")
  ) {
    matchedCategories.push("romchi");
  }

  if (
    q.includes("tozalash") || q.includes("yuvish") || q.includes("uborka") ||
    q.includes("tozalovchi") || q.includes("pilesos") || q.includes("chang") ||
    q.includes("ximchistka") || q.includes("уборк") || q.includes("чистк") ||
    q.includes("мыт") || q.includes("пыл")
  ) {
    matchedCategories.push("tozalovchi");
  }

  return matchedCategories;
};

export default function BookingPage() {
  const { locale, setLocale } = useLanguage();
  const t = dictionaries[locale];

  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<{title: string, desc?: string, type?: 'error'|'success'} | null>(null);
  const showToast = (title: string, desc?: string, type: 'error'|'success' = 'error') => {
    setToastMsg({ title, desc, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const recognitionRef = useRef<any>(null);

  const [filters, setFilters] = useState<FilterState>({
    distance: 50,
    minPrice: 0,
    onlyHighRated: false,
    searchQuery: "",
    region: "Barchasi",
    district: "Barchasi",
  });

  const [masters, setMasters] = useState<Master[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingData(true);
      setLoadError(false);
      try {
        const [querySnapshot, ratings] = await Promise.all([
          getDocs(collection(db, "masters")),
          fetchMasterRatings().catch(() => new Map<string, { average: number | null; count: number }>()),
        ]);
        if (cancelled) return;
        setMasters(
          querySnapshot.docs.map((d) => {
            const docData = d.data();
            return {
              id: d.id,
              firstName: docData.firstName || "",
              lastName: docData.lastName || "",
              phone: docData.phone || "",
              category: docData.category || "",
              services: docData.services || [],
              basePrice: docData.basePrice || 0,
              rating: ratings.get(d.id)?.average ?? 0,
              reviewsCount: ratings.get(d.id)?.count ?? 0,
              isDemo: !!docData.isDemo,
              isHidden: !!docData.isHidden,
              isVerified: docData.isVerified || false,
              region: docData.region || "",
              district: docData.district || "",
              isAvailable: docData.isAvailable ?? true,
            } as Master;
          })
        );
      } catch (error) {
        console.error("Error fetching masters:", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Bosh sahifadagi AI qidiruvdan keladigan query parametrlarini o'qish
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const searchQuery = searchParams.get("search") || "";
      const region = searchParams.get("region") || "Barchasi";
      const promptParam = searchParams.get("prompt") || "";

      if (searchQuery || region !== "Barchasi" || promptParam) {
        setFilters(prev => ({
          ...prev,
          searchQuery: searchQuery || prev.searchQuery,
          region: region !== "Barchasi" ? region : prev.region,
        }));
        if (promptParam) {
          setPrompt(promptParam);
          setAiResult({
            kasb: searchQuery,
            hudud: region,
            tavsif: promptParam,
            holat: "odatiy"
          });
        }
      }
    }
  }, []);


  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Speech Recognition Setup
  const toggleRecording = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(
        tr(locale, "Xatolik", "Ошибка", "Error"),
        tr(locale, "Sizning brauzeringizda ovozli qidiruv qo'llab-quvvatlanmaydi.", "Голосовой поиск не поддерживается в вашем браузере.", "Voice search is not supported in your browser."),
        "error"
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = SPEECH_LANG[locale];
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        handleAiSearch(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast(
            tr(locale, "Mikrofonga ruxsat berilmagan", "Нет доступа к микрофону", "Microphone access denied"),
            tr(locale, "Iltimos, brauzer sozlamalaridan mikrofonga ruxsat bering.", "Разрешите доступ к микрофону в настройках браузера.", "Please allow microphone access in your browser settings."),
            "error"
          );
        } else {
          showToast(
            tr(locale, "Xatolik yuz berdi", "Произошла ошибка", "Something went wrong"),
            tr(locale, "Ovozni aniqlashda xatolik yuz berdi. Qayta urinib ko'ring.", "Не удалось распознать голос. Попробуйте ещё раз.", "Could not recognize your voice. Please try again."),
            "error"
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      showToast(
        tr(locale, "Xatolik", "Ошибка", "Error"),
        tr(locale, "Mikrofonni ishga tushirib bo'lmadi", "Не удалось включить микрофон", "Could not start the microphone"),
        "error"
      );
      setIsListening(false);
    }
  };

  const handleAiSearch = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || prompt;
    if (!finalPrompt.trim()) return;
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      let currentLocation = userLocation;
      if (!currentLocation) {
        currentLocation = await new Promise<string | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const { latitude, longitude } = pos.coords;
                // Nominatim orqali koordinatani manzilga (shahar/tuman) aylantirish
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const geoData = await geoRes.json();
                const address = geoData.address;
                const cityOrRegion = address.city || address.town || address.county || address.state || "O'zbekiston";
                resolve(cityOrRegion);
              } catch (e) {
                resolve(null);
              }
            },
            () => resolve(null), // User denied or error
            { timeout: 5000 }
          );
        });
        if (currentLocation) setUserLocation(currentLocation);
      }

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, userLocation: currentLocation }),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok || data.error) {
        setAiResult({ error: data.error || tr(locale, "Xatolik yuz berdi", "Произошла ошибка", "Something went wrong") });
      } else {
        setAiResult(data);
        if (data.kasb) {
          setFilters(f => ({ ...f, searchQuery: data.kasb }));
        }
        if (data.hudud && data.hudud.toLowerCase() !== "noma'lum") {
          setFilters(f => ({ ...f, region: data.hudud }));
        }
      }
    } catch (err) {
      console.error(err);
      setAiResult({ error: tr(locale, "Server bilan aloqa yo'q", "Нет связи с сервером", "Cannot reach the server") });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredMasters = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();
    const semanticCategories = getSemanticKeywords(query);

    return masters.filter(m => {
      if (m.isHidden || (m.isDemo && !SHOW_DEMO_MASTERS)) return false;
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();

      // Aqlli semantik filtr: ism, xizmat nomi yoki yozilgan so'zning semantik kasbiga mos kelsa
      const matchSearch = !query ||
                          fullName.includes(query) ||
                          m.category.toLowerCase().replace(/_/g, " ").includes(query) ||
                          (m.services && m.services.some(s => s.toLowerCase().includes(query))) ||
                          semanticCategories.includes(m.category.toLowerCase());

      const matchPrice = m.basePrice >= filters.minPrice;
      const matchRating = filters.onlyHighRated ? m.rating >= 4.5 : true;
      const matchRegion = filters.region === "Barchasi" || m.region === filters.region;
      const matchDistrict = filters.district === "Barchasi" || m.district === filters.district;

      return matchSearch && matchPrice && matchRating && matchRegion && matchDistrict;
    }).sort((a, b) => Number(b.isVerified) - Number(a.isVerified) || b.rating - a.rating || b.reviewsCount - a.reviewsCount);
  }, [filters, masters]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans selection:bg-[#F97316]/30 transition-colors duration-300">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* 1-QISM: FAST LANE (AI Agent) */}
        <section className="mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A365D] dark:bg-blue-950 rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden"
          >
            <div className="pattern-star absolute inset-0 opacity-40" aria-hidden="true"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F97316]/20 rounded-full blur-[100px]"></div>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-100 text-sm font-bold mb-6 backdrop-blur-md">
                <Sparkles size={16} className="text-yellow-400" /> Epchil AI - Fast Lane
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-8 leading-tight">
                {t.aiTitle} <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">{t.aiTitleHighlight}</span> {t.aiTitleEnd}
              </h1>

              <div className="relative flex flex-col sm:flex-row items-center gap-3 bg-white/10 p-3 rounded-[2rem] backdrop-blur-md border border-white/20 shadow-inner">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full h-16 bg-transparent text-white placeholder-blue-200/60 px-6 focus:outline-none text-lg font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleRecording}
                    className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 group relative transition-all duration-300 ${isListening ? 'bg-gradient-to-br from-red-500 to-orange-600 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'bg-gradient-to-br from-[#F97316] to-orange-500'}`}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Mic size={28} className={isListening ? "animate-bounce" : ""} />
                  </motion.button>
                  <Button
                    onClick={() => handleAiSearch()}
                    disabled={isAnalyzing}
                    className="h-16 px-8 rounded-2xl bg-[#F97316] sm:bg-white text-white sm:text-[#1A365D] hover:bg-orange-600 sm:hover:bg-slate-100 font-bold text-lg w-full sm:w-auto shadow-xl"
                  >
                    {t.searchBtn} <ArrowRight className="ml-2" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 rounded-full border border-blue-400/30">
                      <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping"></div>
                      <span className="text-lg font-bold text-blue-200">{t.aiAnalyzing}</span>
                    </div>
                  </motion.div>
                )}
                {aiResult && !isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6 text-left shadow-2xl"
                  >
                    {aiResult.error ? (
                      <div className="flex items-center gap-2 mb-4 text-red-400">
                        <CheckCircle2 size={24} />
                        <h3 className="font-bold text-xl">{tr(locale, "Xatolik", "Ошибка", "Error")}: {aiResult.error}</h3>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="text-green-400" size={24} />
                          <h3 className="text-white font-bold text-xl">{t.aiFound}</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="bg-white text-[#1A365D] px-5 py-2.5 rounded-xl font-bold shadow-md">
                            <span className="text-slate-500 font-medium mr-2">{t.kasb}:</span>
                            <span className="capitalize">{aiResult.kasb ? aiResult.kasb.replace(/_/g, " ") : tr(locale, "Aniqlanmadi", "Не определено", "Not detected")}</span>
                          </div>
                          <div className="bg-white text-[#1A365D] px-5 py-2.5 rounded-xl font-bold shadow-md">
                            <span className="text-slate-500 font-medium mr-2">{t.hudud}:</span>
                            {aiResult.hudud || tr(locale, "Toshkent", "Ташкент", "Tashkent")}
                          </div>
                          <div className="bg-[#F97316] text-white px-5 py-2.5 rounded-xl font-bold shadow-md">
                            <span className="text-orange-200 font-medium mr-2">{t.holat}:</span>
                            <span className="capitalize">{aiResult.holat || tr(locale, "Odatiy", "Обычный", "Normal")}</span>
                          </div>
                        </div>
                        <p className="mt-4 text-blue-200 bg-black/20 p-4 rounded-xl border border-white/10 font-medium">
                          {aiResult.tavsif || tr(locale, "AI tomonidan xulosa kutilmoqda...", "Ожидается заключение ИИ...", "Waiting for the AI summary...")}
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* 2-QISM: BROWSE LANE (Catalog & Filters) */}
        <section className="flex flex-col lg:flex-row gap-8">

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter size={20} className="text-[#F97316]" /> {t.filterMobile}
            </span>
            <Button variant="outline" onClick={() => setShowMobileFilter(!showMobileFilter)} className="rounded-xl">
              {showMobileFilter ? t.close : t.open}
            </Button>
          </div>

          {/* Sidebar */}
          <div className={`lg:w-80 shrink-0 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          {/* Master List */}
          <div className="flex-1 min-w-0">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{t.catalogTitle}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  {t.totalFound.replace("{n}", filteredMasters.length.toString())}
                </p>
              </div>
            </div>

            {loadError && (
              <div role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">
                  {tr(locale, "Ustalar ro'yxatini yuklab bo'lmadi. Internet yoki ruxsatlarni tekshiring.", "Не удалось загрузить список мастеров. Проверьте интернет или права доступа.", "Could not load the masters list. Check your connection or permissions.")}
                </span>
                <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)} className="h-9 rounded-xl border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
                  {tr(locale, "Qayta urinish", "Повторить", "Retry")}
                </Button>
              </div>
            )}

            {isLoadingData ? (              <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 h-[230px] flex flex-col justify-between shadow-sm">
                    <div className="flex gap-3">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="flex flex-col gap-2 flex-1 pt-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3 mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-xl" />
                      <Skeleton className="h-6 w-16 rounded-xl" />
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-10 w-16 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMasters.length > 0 ? (
              <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredMasters.map(master => (
                    <motion.div
                      key={master.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="min-w-0"
                    >
                      <MasterCard master={master} aiProblem={prompt} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 sm:p-16 text-center border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 border-4 border-slate-100 dark:border-slate-800">
                  <Search size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{t.notFound}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">{t.notFoundDesc}</p>
                <Button
                  onClick={() => setFilters({ distance: 50, minPrice: 0, onlyHighRated: false, searchQuery: "", region: "Barchasi", district: "Barchasi" })}
                  className="h-12 px-8 rounded-xl bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-bold"
                >
                  {t.clearFilters}
                </Button>
              </motion.div>
            )}
          </div>
        </section>

      </main>

      {/* Toast Notification (shadcn-like) */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 p-5 rounded-2xl shadow-2xl border flex items-start gap-4 sm:max-w-sm backdrop-blur-xl ${
              toastMsg.type === 'error'
                ? 'bg-red-500/90 border-red-500/50 text-white'
                : 'bg-green-500/90 border-green-500/50 text-white'
            }`}
          >
            <div className="flex-1">
              <h4 className="font-bold text-lg">{toastMsg.title}</h4>
              {toastMsg.desc && <p className="text-sm mt-1 opacity-90">{toastMsg.desc}</p>}
            </div>
            <button onClick={() => setToastMsg(null)} className="opacity-60 hover:opacity-100 transition-opacity">
              <span className="text-xl">&times;</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
