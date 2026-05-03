"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ArrowRight, Sparkles, Filter, Search, Bolt, Languages, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterCard, Master } from "@/components/booking/MasterCard";
import { FilterSidebar, FilterState } from "@/components/booking/FilterSidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage } from "@/components/language-provider";
import Link from "next/link";

const mockMasters: Master[] = [
  { id: "1", name: "Azizbek Karimov", avatar: "https://i.pravatar.cc/150?u=a1", profession: "santexnik", rating: 4.9, completedJobs: 142, price: 80000, distance: 3, region: "Toshkent shahri", district: "Yunusobod" },
  { id: "2", name: "Dilshod Rahimov", avatar: "https://i.pravatar.cc/150?u=a2", profession: "elektrik", rating: 4.2, completedJobs: 89, price: 50000, distance: 12, region: "Toshkent shahri", district: "Chilonzor" },
  { id: "3", name: "Rustam Aliyev", avatar: "https://i.pravatar.cc/150?u=a3", profession: "santexnik", rating: 5.0, completedJobs: 300, price: 150000, distance: 5, region: "Samarqand", district: "Samarqand shahri" },
  { id: "4", name: "Murod Jonuzoqov", avatar: "https://i.pravatar.cc/150?u=a4", profession: "maishiy_texnika_ustasi", rating: 4.6, completedJobs: 42, price: 100000, distance: 8, region: "Toshkent viloyati", district: "Zangiota" },
  { id: "5", name: "Olimjon To'rayev", avatar: "https://i.pravatar.cc/150?u=a5", profession: "kafelchi", rating: 4.8, completedJobs: 215, price: 120000, distance: 20, region: "Toshkent shahri", district: "Mirobod" },
  { id: "6", name: "Sardor Ahmedov", avatar: "https://i.pravatar.cc/150?u=a6", profession: "santexnik", rating: 4.4, completedJobs: 56, price: 70000, distance: 15, region: "Samarqand", district: "Urgut" },
  { id: "7", name: "Botir Qodirov", avatar: "https://i.pravatar.cc/150?u=a7", profession: "elektrik", rating: 4.9, completedJobs: 412, price: 90000, distance: 2, region: "Toshkent shahri", district: "Yakkasaroy" },
  { id: "8", name: "Jamshid Tursunov", avatar: "https://i.pravatar.cc/150?u=a8", profession: "tozalovchi", rating: 4.7, completedJobs: 120, price: 150000, distance: 7, region: "Toshkent viloyati", district: "Chirchiq" },
];

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
  }
};

export default function BookingPage() {
  const { locale, setLocale } = useLanguage();
  const t = dictionaries[locale];

  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    distance: 50,
    minPrice: 0,
    onlyHighRated: false,
    searchQuery: "",
    region: "Barchasi",
    district: "Barchasi",
  });

  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Speech Recognition Setup
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sizning brauzeringizda mikrofon orqali yozish imkoniyati yo'q.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale === "uz" ? "uz-UZ" : "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Optional: Auto search after recording finishes
      // handleAiSearch();
    };

    recognition.start();
  };

  const handleAiSearch = async () => {
    if (!prompt.trim()) return;
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
        body: JSON.stringify({ prompt, userLocation: currentLocation }),
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        setAiResult({ error: data.error || "Xatolik yuz berdi" });
      } else {
        setAiResult(data);
        if (data.kasb) {
          setFilters(f => ({ ...f, searchQuery: data.kasb }));
        }
      }
    } catch (err) {
      console.error(err);
      setAiResult({ error: "Server bilan aloqa yo'q" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredMasters = useMemo(() => {
    return mockMasters.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                          m.profession.toLowerCase().replace(/_/g, " ").includes(filters.searchQuery.toLowerCase());
      const matchDistance = m.distance <= filters.distance;
      const matchPrice = m.price >= filters.minPrice;
      const matchRating = filters.onlyHighRated ? m.rating >= 4.5 : true;
      const matchRegion = filters.region === "Barchasi" || m.region === filters.region;
      const matchDistrict = filters.district === "Barchasi" || m.district === filters.district;

      return matchSearch && matchDistance && matchPrice && matchRating && matchRegion && matchDistrict;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans selection:bg-[#F97316]/30 transition-colors duration-300">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-[#1A365D] dark:text-blue-200">
            <div className="bg-gradient-to-br from-[#F97316] to-orange-500 text-white p-1.5 rounded-xl shadow-lg shadow-orange-500/20">
              <Bolt size={24} />
            </div>
            Epchil
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="relative hidden sm:block">
              <Languages className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                className="h-10 appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-9 pr-8 text-sm outline-none cursor-pointer hover:border-[#F97316] transition-colors focus:ring-2 focus:ring-[#F97316]/20 text-slate-900 dark:text-slate-100"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* 1-QISM: FAST LANE (AI Agent) */}
        <section className="mb-14">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A365D] dark:bg-blue-950 rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden"
          >
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
                    onClick={startRecording}
                    className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 group relative ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-[#F97316] to-orange-500'}`}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Mic size={28} className={isRecording ? "animate-bounce" : ""} />
                  </motion.button>
                  <Button 
                    onClick={handleAiSearch}
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
                        <h3 className="font-bold text-xl">Xatolik: {aiResult.error}</h3>
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
                            <span className="capitalize">{aiResult.kasb ? aiResult.kasb.replace(/_/g, " ") : "Aniqlanmadi"}</span>
                          </div>
                          <div className="bg-white text-[#1A365D] px-5 py-2.5 rounded-xl font-bold shadow-md">
                            <span className="text-slate-500 font-medium mr-2">{t.hudud}:</span> 
                            {aiResult.hudud || "Toshkent"}
                          </div>
                          <div className="bg-[#F97316] text-white px-5 py-2.5 rounded-xl font-bold shadow-md">
                            <span className="text-orange-200 font-medium mr-2">{t.holat}:</span> 
                            <span className="capitalize">{aiResult.holat || "Odatiy"}</span>
                          </div>
                        </div>
                        <p className="mt-4 text-blue-200 bg-black/20 p-4 rounded-xl border border-white/10 font-medium">
                          {aiResult.tavsif || "AI tomonidan xulosa kutilmoqda..."}
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

            {filteredMasters.length > 0 ? (
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
                      <MasterCard master={master} />
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
    </div>
  );
}
