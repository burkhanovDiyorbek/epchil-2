"use client";

import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/select";
import { useLanguage, tr } from "@/components/language-provider";
import { REGIONS, REGION_NAMES, placeLabel } from "@/lib/regions";

interface Props {
  region: string;
  district: string;
  onRegionChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  regionError?: string;
  districtError?: string;
  regionLabel: React.ReactNode;
  districtLabel: React.ReactNode;
}

/** Region picker + district picker (free text for regions without a district list). */
export function RegionDistrictFields({
  region, district, onRegionChange, onDistrictChange, regionError, districtError, regionLabel, districtLabel,
}: Props) {
  const { locale } = useLanguage();
  const districts = REGIONS[region] ?? [];
  // A saved value that is not in the list (older free-text profiles) must still be selectable.
  const regionOptions = REGION_NAMES.includes(region) || !region ? REGION_NAMES : [region, ...REGION_NAMES];
  const districtOptions = districts.includes(district) || !district ? districts : [district, ...districts];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="space-y-1.5">
        {regionLabel}
        <CustomSelect
          value={region}
          onChange={(v) => {
            onRegionChange(v);
            onDistrictChange("");
          }}
          options={regionOptions.map((r) => ({ value: r, label: placeLabel(r, locale) }))}
          placeholder={tr(locale, "Viloyatni tanlang", "Выберите область", "Select a region")}
          invalid={!!regionError}
        />
        {regionError && <p className="text-xs font-medium text-red-500">{regionError}</p>}
      </div>
      <div className="space-y-1.5">
        {districtLabel}
        {districts.length > 0 ? (
          <CustomSelect
            value={district}
            onChange={onDistrictChange}
            options={districtOptions.map((d) => ({ value: d, label: placeLabel(d, locale) }))}
            placeholder={tr(locale, "Tumanni tanlang", "Выберите район", "Select a district")}
            invalid={!!districtError}
          />
        ) : (
          <Input
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            disabled={!region}
            placeholder={tr(locale, "Tuman yoki shahar nomi", "Район или город", "District or city name")}
            className="h-12 rounded-xl"
          />
        )}
        {districtError && <p className="text-xs font-medium text-red-500">{districtError}</p>}
      </div>
    </div>
  );
}
