import { Star, BadgeCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Master {
  id: string;
  name: string;
  avatar: string;
  profession: string;
  rating: number;
  completedJobs: number;
  price: number;
  distance: number;
  region: string;
  district: string;
}

export function MasterCard({ master }: { master: Master }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
      <div className="flex items-start gap-3 mb-5">
        <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-100">
          <img src={master.avatar} alt={master.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
            {master.name}
            <BadgeCheck className="text-blue-500 shrink-0" size={16} />
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize truncate">{master.profession.replace(/_/g, " ")}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{master.region}, {master.district}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-xl text-sm font-semibold">
          <Star size={14} fill="currentColor" /> {master.rating}
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl text-sm font-semibold">
          <Briefcase size={14} /> {master.completedJobs}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider font-semibold">Xizmat narxi</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{master.price.toLocaleString()} UZS</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-3 h-10 text-sm">
            Chat
          </Button>
          <Button className="flex-1 sm:flex-none bg-[#F97316] hover:bg-[#EA580C] text-white shadow-lg shadow-orange-500/20 rounded-xl px-4 h-10 text-sm">
            Chaqirish
          </Button>
        </div>
      </div>
    </div>
  );
}
