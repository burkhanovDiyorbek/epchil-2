"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface CancelReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  locale: string;
}

export function CancelReasonModal({ isOpen, onClose, onConfirm, locale }: CancelReasonModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const t = {
    uz: {
      title: "Buyurtmani bekor qilish",
      desc: "Iltimos, buyurtmani bekor qilish sababini ko'rsating. Bu xizmat sifatini oshirishga yordam beradi.",
      presets: [
        "Rejalarim o'zgardi / Kechiktirildi",
        "Narxi to'g'ri kelmadi / Qimmat",
        "Boshqa usta topdim",
        "Usta/Mijoz bilan aloqaga chiqib bo'lmadi"
      ],
      placeholder: "Qo'shimcha izoh qoldiring (ixtiyoriy)...",
      cancel: "Orqaga",
      submit: "Tasdiqlash & Bekor qilish",
      validation: "Iltimos, bekor qilish sababini tanlang yoki yozing!"
    },
    ru: {
      title: "Отмена заказа",
      desc: "Пожалуйста, укажите причину отмены заказа. Это поможет нам улучшить качество сервиса.",
      presets: [
        "Планы изменились / Перенесено",
        "Не устроила цена / Дорого",
        "Нашел другого специалиста",
        "Не удалось связаться с другой стороной"
      ],
      placeholder: "Оставьте дополнительный комментарий (необязательно)...",
      cancel: "Назад",
      submit: "Подтвердить отмену",
      validation: "Пожалуйста, выберите или напишите причину отмены!"
    },
    en: {
      title: "Cancel order",
      desc: "Please tell us why you are cancelling. It helps us improve the service.",
      presets: [
        "My plans changed / Postponed",
        "The price did not suit me / Too expensive",
        "I found another master",
        "Could not reach the other party"
      ],
      placeholder: "Add an extra comment (optional)...",
      cancel: "Back",
      submit: "Confirm cancellation",
      validation: "Please choose or write a reason for cancelling!"
    },
  }[locale as "uz" | "ru" | "en"] || {
    title: "Cancellation",
    desc: "Specify your reason",
    presets: [],
    placeholder: "Comment...",
    cancel: "Close",
    submit: "Cancel Order",
    validation: "Provide a reason"
  };

  const handleConfirm = () => {
    const finalReason = selectedPreset
      ? `${selectedPreset}${reason ? ` (${reason})` : ""}`
      : reason;

    if (!finalReason.trim()) {
      setError(t.validation);
      return;
    }

    onConfirm(finalReason);
    setReason("");
    setSelectedPreset(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <AlertTriangle className="text-red-500 animate-pulse" size={22} />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-normal">
            {t.desc}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3.5">
          {/* Preset Buttons */}
          <div className="flex flex-col gap-2">
            {t.presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSelectedPreset(preset)}
                className={`w-full text-left text-xs font-semibold px-4 py-3 rounded-2xl border transition-all duration-200 ${
                  selectedPreset === preset
                    ? "bg-red-500/10 text-red-500 border-red-500/30 font-bold"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:border-red-500/20"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t.placeholder}
            className="w-full h-20 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-xs sm:text-sm dark:text-white resize-none"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <DialogFooter className="flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl px-4 font-bold text-xs"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPreset && !reason.trim()}
            className="bg-red-500 hover:bg-red-650 text-white rounded-xl px-5 font-bold text-xs shadow-md shadow-red-500/10 active:scale-[0.97]"
          >
            {t.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
