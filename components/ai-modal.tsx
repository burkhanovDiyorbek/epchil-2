"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MapPin, CheckCircle2, Loader2, ArrowRight, Wallet, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage, tr, pick, SPEECH_LANG } from "@/components/language-provider";

export function AiModal({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const { locale } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [address, setAddress] = useState("");
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  // Inline error instead of blocking alert() dialogs (alerts freeze the page and automated tests).
  const [errorMsg, setErrorMsg] = useState("");

  const recognitionRef = useRef<any>(null);

  const priceEstimates: { [key: string]: number } = {
    santexnik: 80000,
    elektrik: 90000,
    kafelchi: 120000,
    romchi: 100000,
    tozalovchi: 70000,
  };

  const texts = {
    uz: {
      step1: "Muammoni ayting",
      step1Desc: "Ovozli xabar qoldiring yoki matn yozing",
      step2: "Manzilni tasdiqlang",
      step2Desc: "Sizga qayerga usta kerak?",
      step3: "Tasdiqlash va Narx",
      step3Desc: "Usta 5 daqiqada yetib keladi",
      analyzeBtn: "AI Tahlil qilish",
      nextBtn: "Keyingi qadam",
      confirmBtn: "Buyurtma berish",
      analyzing: "Tahlil qilinmoqda...",
      aiFound: "Tegishli mutaxassis topildi!",
      estPrice: "Taxminiy narx: 80,000 so'm",
    },
    ru: {
      step1: "Опишите проблему",
      step1Desc: "Оставьте голосовое или напишите",
      step2: "Подтвердите адрес",
      step2Desc: "Куда нужен мастер?",
      step3: "Подтверждение и Цена",
      step3Desc: "Мастер прибудет через 5 минут",
      analyzeBtn: "Анализировать",
      nextBtn: "Следующий шаг",
      confirmBtn: "Оформить заказ",
      analyzing: "Анализируем...",
      aiFound: "Специалист найден!",
      estPrice: "Примерная цена: 80,000 сум",
    },
    en: {
      step1: "Describe the problem",
      step1Desc: "Leave a voice message or type it",
      step2: "Confirm the address",
      step2Desc: "Where do you need a master?",
      step3: "Confirmation and price",
      step3Desc: "The master arrives in about 5 minutes",
      analyzeBtn: "Analyze with AI",
      nextBtn: "Next step",
      confirmBtn: "Place order",
      analyzing: "Analyzing...",
      aiFound: "Specialist found!",
      estPrice: "Estimated price: 80,000 UZS",
    },
  };

  const t = pick(locale, texts);

  // GPS orqali manzilni aniqlash
  const fetchUserLocation = async () => {
    if (userLocation) return userLocation;
    setIsLoadingLocation(true);
    const loc = await new Promise<string | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            // Nominatim reverse geocoding API
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const geoData = await geoRes.json();
            const addr = geoData.address;
            const cityOrRegion = addr.city || addr.town || addr.county || addr.state || "Toshkent";
            resolve(cityOrRegion);
          } catch (e) {
            resolve("Toshkent");
          }
        },
        () => resolve("Toshkent"),
        { timeout: 5000 }
      );
    });
    if (loc) {
      setUserLocation(loc);
      setAddress(loc);
    }
    setIsLoadingLocation(false);
    return loc || "Toshkent";
  };

  // Modal ochilganda GPS manzilni fon rejimida olishni boshlaymiz
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPrompt("");
      setAddress("");
      setAiResult(null);
      fetchUserLocation().catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg(tr(locale, "Sizning brauzeringizda ovozli qidiruv qo'llab-quvvatlanmaydi.", "Голосовой поиск не поддерживается в вашем браузере.", "Voice search is not supported in your browser."));
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
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("Speech error:", error);
      setIsListening(false);
    }
  };

  const handleNext = async () => {
    setErrorMsg("");
    if (step === 1) {
      if (!prompt.trim()) {
        setErrorMsg(tr(locale, "Iltimos, muammoni yozing yoki ovoz yozing.", "Пожалуйста, опишите проблему.", "Please describe the problem by typing or speaking."));
        return;
      }
      setIsAnalyzing(true);
      try {
        const currentLoc = userLocation || await fetchUserLocation() || "Toshkent";
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, userLocation: currentLoc }),
        });
        const data = await res.json();
        if (data.error) {
          setErrorMsg(String(data.error));
        } else {
          setAiResult(data);
          if (data.hudud && data.hudud.toLowerCase() !== "noma'lum") {
            setAddress(data.hudud);
          }
          setStep(2);
        }
      } catch (err) {
        console.error("AI analysis error:", err);
        setErrorMsg(tr(locale, "Tahlil qilishda xatolik yuz berdi.", "Произошла ошибка при анализе.", "An error occurred during analysis."));
      } finally {
        setIsAnalyzing(false);
      }
    } else if (step === 2) {
      if (!address.trim()) {
        setErrorMsg(tr(locale, "Iltimos, manzilni kiriting.", "Пожалуйста, введите адрес.", "Please enter an address."));
        return;
      }
      setStep(3);
    }
  };

  const handleConfirm = () => {
    const searchVal = aiResult?.kasb || "";
    const locVal = address || aiResult?.hudud || "Barchasi";
    router.push(`/booking?search=${encodeURIComponent(searchVal)}&region=${encodeURIComponent(locVal)}&prompt=${encodeURIComponent(prompt)}`);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => setStep(1), 300); // reset after close animation
    }
  };

  const getEstPriceText = () => {
    const profession = aiResult?.kasb?.toLowerCase();
    const price = priceEstimates[profession] || 80000;
    const n = price.toLocaleString();
    return tr(locale, `Taxminiy narx: ${n} so'm`, `Примерная цена: ${n} сум`, `Estimated price: ${n} UZS`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden p-0 shadow-2xl">
        <div className="bg-gradient-to-br from-[#1A365D]/10 to-[#F97316]/10 p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Sparkles className="text-[#F97316]" /> Epchil AI Match
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              {step === 1 && t.step1Desc}
              {step === 2 && t.step2Desc}
              {step === 3 && t.step3Desc}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper indicator */}
          <div className="flex gap-2 mt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-[#F97316]" : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6 relative min-h-[250px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="relative">
                  {isListening && (
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleRecording}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer transition-all duration-300 ${
                      isListening
                        ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                        : 'bg-gradient-to-br from-[#F97316] to-orange-500 hover:shadow-orange-500/20'
                    }`}
                  >
                    <Mic size={36} className={isListening ? "animate-bounce" : ""} />
                  </motion.div>
                </div>
                <div className="w-full">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={tr(locale, "Yoki muammoni matn shaklida yozing...", "Или напишите текстом...", "Or type the problem here...")}
                    className="w-full h-24 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 resize-none dark:text-white"
                  ></textarea>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-2xl border border-green-200 dark:border-green-800/30">
                  <CheckCircle2 size={24} className="shrink-0" />
                  <p className="text-sm font-medium">
                    {aiResult ? (
                      tr(
                        locale,
                        `${aiResult.kasb ? aiResult.kasb.charAt(0).toUpperCase() + aiResult.kasb.slice(1) : "Usta"} aniqlandi! (${aiResult.tavsif || ""})`,
                        `Найден ${aiResult.kasb ? aiResult.kasb : "мастер"}! (${aiResult.tavsif || ""})`,
                        `${aiResult.kasb ? aiResult.kasb.charAt(0).toUpperCase() + aiResult.kasb.slice(1) : "Master"} identified! (${aiResult.tavsif || ""})`
                      )
                    ) : t.aiFound}
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <MapPin size={16} /> {tr(locale, "Manzil", "Адрес", "Address")}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={tr(locale, "Shahar, ko'cha, uy...", "Город, улица, дом...", "City, street, house...")}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 dark:text-white"
                  />
                  {isLoadingLocation ? (
                    <div className="text-xs text-[#F97316] animate-pulse flex items-center gap-1.5 py-1">
                      <Loader2 className="animate-spin" size={12} />
                      {tr(locale, "Manzil aniqlanmoqda...", "Определение адреса...", "Detecting address...")}
                    </div>
                  ) : (
                    <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-900 w-full overflow-hidden relative border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-3">
                      <MapPin size={20} className="text-[#F97316] mb-1 animate-bounce" />
                      <div className="text-slate-800 dark:text-slate-200 text-xs font-bold text-center truncate w-full px-4">
                        {address || tr(locale, "Toshkent shahri", "Город Ташкент", "Tashkent city")}
                      </div>
                      <div className="text-slate-400 text-[10px] mt-1">
                        {tr(locale, "GPS orqali avtomatik olingan", "Определено по GPS автоматически", "Detected automatically via GPS")}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Wallet size={36} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{getEstPriceText()}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                    {tr(
                      locale,
                      "Yakuniy narx usta kelganidan so'ng ish hajmiga qarab usta bilan o'zaro kelishiladi.",
                      "Окончательная цена будет согласована с мастером на месте в зависимости от объема работ.",
                      "The final price is agreed with the master on site, depending on the scope of work."
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {errorMsg && (
          <p role="alert" className="mx-6 mb-0 -mt-2 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {errorMsg}
          </p>
        )}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <Button
            onClick={step === 3 ? handleConfirm : handleNext}
            disabled={isAnalyzing}
            className="w-full sm:w-auto h-12 rounded-xl bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-semibold"
          >
            {isAnalyzing ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t.analyzing}</>
            ) : step === 1 ? (
              <>{t.analyzeBtn} <ArrowRight className="ml-2 h-5 w-5" /></>
            ) : step === 3 ? (
              <><CheckCircle2 className="mr-2 h-5 w-5" /> {t.confirmBtn}</>
            ) : (
              <>{t.nextBtn} <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

