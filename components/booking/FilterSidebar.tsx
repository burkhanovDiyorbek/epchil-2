"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Search, MapPin } from "lucide-react";

export interface FilterState {
  distance: number;
  minPrice: number;
  onlyHighRated: boolean;
  searchQuery: string;
  region: string;
  district: string;
}

const REGIONS: Record<string, string[]> = {
  "Barchasi": [],
  "Toshkent shahri": ["Mirobod", "Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yakkasaroy"],
  "Toshkent viloyati": ["Zangiota", "Qibray", "Chirchiq", "Parkent", "Nurafshon"],
  "Samarqand": ["Samarqand shahri", "Urgut", "Pastdarg'om", "Toyloq"],
};

export function FilterSidebar({
  filters,
  setFilters,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  const districts = filters.region ? REGIONS[filters.region] : [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-7 shadow-sm sticky top-28">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Filtrlar</h2>
      
      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
            Qidiruv
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Ism yoki kasb..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(f => ({...f, searchQuery: e.target.value}))}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D] transition-all"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <MapPin size={16} /> Viloyat
          </label>
          <select 
            value={filters.region}
            onChange={(e) => setFilters(f => ({...f, region: e.target.value, district: "Barchasi"}))}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D] transition-all cursor-pointer"
          >
            {Object.keys(REGIONS).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {districts && districts.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
              Tuman
            </label>
            <select 
              value={filters.district}
              onChange={(e) => setFilters(f => ({...f, district: e.target.value}))}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D] transition-all cursor-pointer"
            >
              <option value="Barchasi">Barcha tumanlar</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Masofa
            </label>
            <span className="text-xs font-bold text-white bg-[#F97316] px-2 py-1 rounded-md">{filters.distance} km</span>
          </div>
          <Slider 
            value={[filters.distance]} 
            onValueChange={([val]) => setFilters(f => ({...f, distance: val}))} 
            max={50} 
            step={1} 
          />
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Boshlang'ich narx
            </label>
            <span className="text-xs font-bold text-white bg-[#1A365D] dark:bg-blue-600 px-2 py-1 rounded-md">{filters.minPrice.toLocaleString()} UZS</span>
          </div>
          <Slider 
            value={[filters.minPrice]} 
            onValueChange={([val]) => setFilters(f => ({...f, minPrice: val}))} 
            max={500000} 
            step={10000} 
          />
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>0</span>
            <span>500K+</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            Faqat 4.5+ yulduzlilar
          </label>
          <Switch 
            checked={filters.onlyHighRated}
            onCheckedChange={(val) => setFilters(f => ({...f, onlyHighRated: val}))}
          />
        </div>
      </div>
    </div>
  );
}
