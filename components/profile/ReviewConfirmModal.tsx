"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

interface ReviewConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { rating: number; comment: string; price: number }) => void;
  locale: string;
  mode: "client" | "master";
  partnerName: string;
  partnerPrice?: number;
  basePrice?: number;
}

export function ReviewConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  locale,
  mode,
  partnerName,
  partnerPrice,
  basePrice = 10000
}: ReviewConfirmModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [priceInput, setPriceInput] = useState<string>(
    partnerPrice ? String(partnerPrice) : String(basePrice)
  );

  const t = {
    uz: {
      title: mode === "client" ? "Ishni tasdiqlash & Baholash" : "Ish yakunini tasdiqlash & Baholash",
      desc: mode === "client"
        ? `Usta ${partnerName} tomonidan bajarilgan ishni tasdiqlang, yakuniy to'lov va ustaga baho bering.`
        : `Mijoz ${partnerName} uchun xizmatni yakunlang, yakuniy summani ko'rsating va mijozga baho bering.`,
      labelPrice: mode === "client" ? "To'langan yakuniy narx (UZS)" : "Xizmatning yakuniy summasi (UZS)",
      partnerPriceHint: `Usta belgilagan narx: ${partnerPrice?.toLocaleString()} UZS`,
      labelRating: mode === "client" ? "Ustaga baho bering" : "Mijozga baho bering",
      labelComment: "Fikr / Sharh qoldiring",
      placeholderComment: "Fikringizni shu yerga yozing...",
      cancel: "Bekor qilish",
      submit: "Tasdiqlash & Yuborish",
      validationPrice: "Narx kamida 1,000 so'm bo'lishi kerak!"
    },
    ru: {
      title: mode === "client" ? "Подтверждение & Оценка" : "Завершение работы & Оценка",
      desc: mode === "client"
        ? `Подтвердите работу мастера ${partnerName}, укажите окончательную стоимость оплаты и оцените мастера.`
        : `Завершите работу для клиента ${partnerName}, укажите окончательную сумму и оцените клиента.`,
      labelPrice: mode === "client" ? "Итоговая оплаченная сумма (UZS)" : "Итоговая стоимость услуг (UZS)",
      partnerPriceHint: `Мастер указал сумму: ${partnerPrice?.toLocaleString()} UZS`,
      labelRating: mode === "client" ? "Оцените мастера" : "Оцените клиента",
      labelComment: "Оставьте отзыв",
      placeholderComment: "Напишите ваш отзыв здесь...",
      cancel: "Отмена",
      submit: "Подтвердить & Отправить",
      validationPrice: "Цена должна быть не менее 1,000 UZS!"
    },
    en: {
      title: mode === "client" ? "Confirm work & rate" : "Complete work & rate",
      desc: mode === "client"
        ? `Confirm the work done by master ${partnerName}, enter the final price paid and rate the master.`
        : `Complete the job for client ${partnerName}, enter the final amount and rate the client.`,
      labelPrice: mode === "client" ? "Final price paid (UZS)" : "Final service amount (UZS)",
      partnerPriceHint: `Price set by the master: ${partnerPrice?.toLocaleString()} UZS`,
      labelRating: mode === "client" ? "Rate the master" : "Rate the client",
      labelComment: "Leave a review",
      placeholderComment: "Write your review here...",
      cancel: "Cancel",
      submit: "Confirm & send",
      validationPrice: "The price must be at least 1,000 UZS!"
    },
  }[locale as "uz" | "ru" | "en"] || {
    title: "Confirm & Rate",
    desc: "Confirm final price and rate",
    labelPrice: "Final Price",
    partnerPriceHint: "",
    labelRating: "Rate partner",
    labelComment: "Review",
    placeholderComment: "Review...",
    cancel: "Cancel",
    submit: "Confirm & Submit",
    validationPrice: "Invalid price"
  };

  const handleSubmit = () => {
    const numericPrice = Number(priceInput.replace(/\D/g, ""));
    if (numericPrice < 1000) {
      setError(t.validationPrice);
      return;
    }

    onConfirm({
      rating,
      comment,
      price: numericPrice
    });

    // reset states
    setComment("");
    setRating(5);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mt-1">
            {t.desc}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Price Input Block */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <DollarSign size={13} className="text-[#F97316]" />
              {t.labelPrice}
            </Label>
            <Input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              placeholder="e.g. 50000"
            />
            {mode === "client" && partnerPrice && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg w-fit border border-emerald-500/10">
                {t.partnerPriceHint}
              </p>
            )}
          </div>

          {/* Interactive Star Selector */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.labelRating}
            </Label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isSelected = starValue <= (hoverRating !== null ? hoverRating : rating);
                return (
                  <motion.button
                    key={starValue}
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={28}
                      className={`transition-colors duration-150 ${
                        isSelected
                          ? "text-yellow-500 fill-yellow-500 animate-pulse"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.labelComment}
            </Label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.placeholderComment}
              className="w-full h-20 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] text-xs sm:text-sm dark:text-white resize-none"
            />
          </div>
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
            onClick={handleSubmit}
            className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl px-5 font-bold text-xs shadow-md shadow-orange-500/10 active:scale-[0.97]"
          >
            {t.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
