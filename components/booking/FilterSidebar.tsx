"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage, pick, type Locale } from "@/components/language-provider";
import { REGIONS, REGION_NAMES, placeLabel } from "@/lib/regions";

export interface FilterState {
  distance: number;
  minPrice: number;
  onlyHighRated: boolean;
  searchQuery: string;
  region: string;
  district: string;
}

const allLabel = (locale: Locale) => (locale === "uz" ? "Barchasi" : locale === "ru" ? "Все" : "All");

function label(value: string, locale: Locale) {
  return value === "Barchasi" ? allLabel(locale) : placeLabel(value, locale);
}

const dict = {
  uz: {
    title: "Filtrlar",
    searchLabel: "Kalit so'z bo'yicha qidiruv",
    searchPlaceholder: "Ism, kasb yoki muammo...",
    regionLabel: "Viloyat / Shahar",
    regionPlaceholder: "Viloyat tanlang",
    districtLabel: "Tuman",
    districtPlaceholder: "Tuman tanlang",
    allDistricts: "Barcha tumanlar",
    distanceLabel: "Qidiruv masofasi",
    priceLabel: "Boshlang'ich narx",
    onlyRatedLabel: "Faqat 4.5+ reytinglilar",
  },
  ru: {
    title: "Фильтры",
    searchLabel: "Поиск по ключевому слову",
    searchPlaceholder: "Имя, профессия или проблема...",
    regionLabel: "Область / Город",
    regionPlaceholder: "Выберите область",
    districtLabel: "Район",
    districtPlaceholder: "Выберите район",
    allDistricts: "Все районы",
    distanceLabel: "Радиус поиска",
    priceLabel: "Начальная цена",
    onlyRatedLabel: "Только с рейтингом 4.5+",
  },
  en: {
    title: "Filters",
    searchLabel: "Keyword search",
    searchPlaceholder: "Name, trade or problem...",
    regionLabel: "Region / City",
    regionPlaceholder: "Select a region",
    districtLabel: "District",
    districtPlaceholder: "Select a district",
    allDistricts: "All districts",
    distanceLabel: "Search radius",
    priceLabel: "Starting price",
    onlyRatedLabel: "Only 4.5+ rated",
  },
};

export function FilterSidebar({
  filters,
  setFilters,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  const { locale } = useLanguage();
  const t = pick(locale, dict);

  const districts = filters.region ? REGIONS[filters.region] ?? [] : [];

  return (
    <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-[2.5rem] p-6 shadow-sm lg:sticky lg:top-28 transition-all">
      <div className="pattern-star mask-fade pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-60" aria-hidden="true" />
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <SlidersHorizontal className="text-[#F97316]" size={18} />
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{t.title}</h2>
      </div>

      <div className="space-y-6">
        {/* Keyword Search */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
            {t.searchLabel}
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={filters.searchQuery}
              onChange={(e) => setFilters(f => ({...f, searchQuery: e.target.value}))}
              className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all"
            />
          </div>
        </div>

        {/* Region Selector */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin size={15} className="text-[#F97316]" /> {t.regionLabel}
          </label>
          <Select
            value={filters.region}
            onValueChange={(val) => setFilters(f => ({...f, region: val, district: "Barchasi"}))}
          >
            <SelectTrigger className="w-full h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-[#F97316]/55 focus:border-[#F97316] text-xs sm:text-sm dark:text-white">
              <SelectValue placeholder={t.regionPlaceholder} />
            </SelectTrigger>
            <SelectContent className="z-[100] max-h-60 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
              {["Barchasi", ...REGION_NAMES].map(r => (
                <SelectItem key={r} value={r} className="rounded-xl text-xs sm:text-sm">{label(r, locale)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District Selector */}
        {districts && districts.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
              {t.districtLabel}
            </label>
            <Select
              value={filters.district}
              onValueChange={(val) => setFilters(f => ({...f, district: val}))}
            >
              <SelectTrigger className="w-full h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-[#F97316]/55 focus:border-[#F97316] text-xs sm:text-sm dark:text-white">
                <SelectValue placeholder={t.districtPlaceholder} />
              </SelectTrigger>
              <SelectContent className="z-[100] max-h-60 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
                <SelectItem value="Barchasi" className="rounded-xl text-xs sm:text-sm">{t.allDistricts}</SelectItem>
                {districts.map(d => (
                  <SelectItem key={d} value={d} className="rounded-xl text-xs sm:text-sm">{label(d, locale)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Distance Slider */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.distanceLabel}
            </label>
            <span className="text-[10px] font-extrabold text-white bg-[#F97316] px-2.5 py-1 rounded-xl shadow-md tracking-wide">
              {filters.distance} km
            </span>
          </div>
          <Slider
            value={[filters.distance]}
            onValueChange={([val]) => setFilters(f => ({...f, distance: val}))}
            max={50}
            step={1}
            className="py-1 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold tracking-wide uppercase">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>

        {/* Base Price Slider */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.priceLabel}
            </label>
            <span className="text-[10px] font-extrabold text-white bg-[#1A365D] dark:bg-blue-600 px-2.5 py-1 rounded-xl shadow-md tracking-wide">
              {filters.minPrice.toLocaleString()} UZS
            </span>
          </div>
          <Slider
            value={[filters.minPrice]}
            onValueChange={([val]) => setFilters(f => ({...f, minPrice: val}))}
            max={500000}
            step={10000}
            className="py-1 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold tracking-wide uppercase">
            <span>0 UZS</span>
            <span>500K+ UZS</span>
          </div>
        </div>

        {/* High Rated Switch */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            {t.onlyRatedLabel}
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
