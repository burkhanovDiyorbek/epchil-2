"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveSectionProps {
  saved: boolean;
  isSaving: boolean;
  saveText: string;
  savedSuccessText: string;
}

export function SaveSection({ saved, isSaving, saveText, savedSuccessText }: SaveSectionProps) {
  return (
    <div className="pt-2 space-y-3 w-full">
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold"
          >
            <CheckCircle2 size={16} /> {savedSuccessText}
          </motion.div>
        )}
      </AnimatePresence>
      <Button 
        type="submit" 
        disabled={isSaving} 
        className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold transition-all shadow-md shadow-orange-500/15 active:scale-[0.98]"
      >
        {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> {saveText}</>}
      </Button>
    </div>
  );
}
