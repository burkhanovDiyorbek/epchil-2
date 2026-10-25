import type { Locale } from "@/components/language-provider";

/** Display names for master categories. Stored values stay lowercase Uzbek keys. */
const LABELS: Record<string, { uz: string; ru: string; en: string }> = {
  santexnik: { uz: "Santexnik", ru: "Сантехник", en: "Plumber" },
  elektrik: { uz: "Elektrik", ru: "Электрик", en: "Electrician" },
  kafelchi: { uz: "Kafelchi", ru: "Плиточник", en: "Tiler" },
  romchi: { uz: "Romchi", ru: "Оконщик", en: "Window fitter" },
  tozalovchi: { uz: "Tozalovchi", ru: "Уборка", en: "Cleaning" },
  duradgor: { uz: "Duradgor", ru: "Плотник", en: "Carpenter" },
  konditsioner: { uz: "Konditsioner", ru: "Кондиционеры", en: "Air conditioning" },
  quruvchi: { uz: "Quruvchi", ru: "Строитель", en: "Builder" },
  rassom: { uz: "Rassom", ru: "Маляр", en: "Painter" },
  "maishiy texnika": { uz: "Maishiy texnika", ru: "Бытовая техника", en: "Appliances" },
  boshqa: { uz: "Boshqa", ru: "Другое", en: "Other" },
};

export function categoryLabel(value: string | undefined, locale: Locale): string {
  if (!value) return "";
  const key = value.toLowerCase().replace(/_/g, " ");
  const hit = LABELS[key];
  if (hit) return hit[locale];
  return value.charAt(0).toUpperCase() + value.slice(1);
}
