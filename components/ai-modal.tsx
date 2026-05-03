"use client";

import { useState } from "react";
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
import { useLanguage } from "@/components/language-provider";

export function AiModal({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const { locale } = useLanguage();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const texts = {
    uz: {
      step1: "Muammoni ayting",
      step1Desc: "Ovozli xabar qoldiring yoki matn yozing",
      step2: "Manzilni kiriting",
      step2Desc: "Sizga qayerga usta kerak?",
      step3: "Tasdiqlash va Narx",
      step3Desc: "Usta 5 daqiqada yetib keladi",
      analyzeBtn: "AI Tahlil qilish",
      nextBtn: "Keyingi qadam",
      confirmBtn: "Buyurtma berish",
      analyzing: "Tahlil qilinmoqda...",
      aiFound: "Santexnik topildi! (Reyting: 4.9)",
      estPrice: "Taxminiy narx: 80,000 so'm",
    },
    ru: {
      step1: "Опишите проблему",
      step1Desc: "Оставьте голосовое или напишите",
      step2: "Введите адрес",
      step2Desc: "Куда нужен мастер?",
      step3: "Подтверждение и Цена",
      step3Desc: "Мастер прибудет через 5 минут",
      analyzeBtn: "Анализировать",
      nextBtn: "Следующий шаг",
      confirmBtn: "Оформить заказ",
      analyzing: "Анализируем...",
      aiFound: "Сантехник найден! (Рейтинг: 4.9)",
      estPrice: "Примерная цена: 80,000 сум",
    }
  };

  const t = texts[locale];

  const handleNext = () => {
    if (step === 1) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setStep(2);
      }, 2000);
    } else if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => setStep(1), 300); // reset after close animation
    }
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
                  <div className="absolute inset-0 bg-[#F97316]/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#F97316] to-orange-500 flex items-center justify-center text-white shadow-xl cursor-pointer hover:scale-105 transition-transform">
                    <Mic size={36} />
                  </div>
                </div>
                <div className="w-full">
                  <textarea
                    placeholder={locale === "uz" ? "Yoki matn shaklida yozing..." : "Или напишите текстом..."}
                    className="w-full h-24 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 resize-none"
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
                  <p className="text-sm font-medium">{t.aiFound}</p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <MapPin size={16} /> Manzil
                  </label>
                  <input
                    type="text"
                    placeholder={locale === "uz" ? "Shahar, ko'cha, uy..." : "Город, улица, дом..."}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50"
                  />
                  <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800 w-full overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
                      {locale === "uz" ? "Xarita ko'rinishi" : "Карта"}
                    </div>
                  </div>
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
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.estPrice}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{locale === "uz" ? "Usta kelganidan so'ng aniq narx belgilanadi." : "Точная цена будет известна после осмотра."}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <Button
            onClick={step === 3 ? () => handleOpenChange(false) : handleNext}
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
