import type { Locale } from "@/components/language-provider";

/**
 * Regions of Uzbekistan and (where known) their districts.
 * Stored values are the Uzbek names so catalog filters and master profiles always match.
 * Regions without a district list fall back to free-text district entry.
 */
export const REGIONS: Record<string, string[]> = {
  "Toshkent shahri": ["Mirobod", "Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yakkasaroy", "Shayxontohur", "Olmazor", "Sergeli", "Uchtepa", "Yashnobod", "Bektemir", "Yangihayot"],
  "Toshkent viloyati": ["Zangiota", "Qibray", "Chirchiq", "Parkent", "Nurafshon", "Angren", "Olmaliq", "Bekobod", "Yangiyo'l"],
  "Samarqand": ["Samarqand shahri", "Urgut", "Pastdarg'om", "Toyloq", "Kattaqo'rg'on", "Jomboy", "Bulung'ur", "Ishtixon", "Narpay", "Payariq", "Oqdaryo", "Nurobod"],
  "Qashqadaryo": ["Qarshi shahri", "Shahrisabz", "Kitob", "Koson", "Muborak", "G'uzor", "Yakkabog'", "Chiroqchi", "Dehqonobod", "Nishon", "Qamashi", "Mirishkor"],
  "Buxoro": [],
  "Farg'ona": [],
  "Andijon": [],
  "Namangan": [],
  "Xorazm": [],
  "Navoiy": [],
  "Jizzax": [],
  "Sirdaryo": [],
  "Surxondaryo": [],
  "Qoraqalpog'iston": [],
};

const LABELS: Record<string, { ru: string; en: string }> = {
  "Toshkent shahri": { ru: "г. Ташкент", en: "Tashkent city" },
  "Toshkent viloyati": { ru: "Ташкентская обл.", en: "Tashkent region" },
  "Samarqand": { ru: "Самаркандская обл.", en: "Samarkand" },
  "Qashqadaryo": { ru: "Кашкадарьинская обл.", en: "Kashkadarya" },
  "Buxoro": { ru: "Бухарская обл.", en: "Bukhara" },
  "Farg'ona": { ru: "Ферганская обл.", en: "Fergana" },
  "Andijon": { ru: "Андижанская обл.", en: "Andijan" },
  "Namangan": { ru: "Наманганская обл.", en: "Namangan" },
  "Xorazm": { ru: "Хорезмская обл.", en: "Khorezm" },
  "Navoiy": { ru: "Навоийская обл.", en: "Navoi" },
  "Jizzax": { ru: "Джизакская обл.", en: "Jizzakh" },
  "Sirdaryo": { ru: "Сырдарьинская обл.", en: "Sirdarya" },
  "Surxondaryo": { ru: "Сурхандарьинская обл.", en: "Surkhandarya" },
  "Qoraqalpog'iston": { ru: "Каракалпакстан", en: "Karakalpakstan" },
  "Samarqand shahri": { ru: "г. Самарканд", en: "Samarkand city" },
  "Qarshi shahri": { ru: "г. Карши", en: "Karshi city" },
  "Shahrisabz": { ru: "Шахрисабз", en: "Shakhrisabz" },
  "Mirobod": { ru: "Мирабад", en: "Mirabad" },
  "Yunusobod": { ru: "Юнусабад", en: "Yunusabad" },
  "Chilonzor": { ru: "Чиланзар", en: "Chilanzar" },
  "Mirzo Ulug'bek": { ru: "Мирзо-Улугбек", en: "Mirzo Ulugbek" },
  "Yakkasaroy": { ru: "Яккасарай", en: "Yakkasaray" },
  "Shayxontohur": { ru: "Шайхантахур", en: "Shaykhantakhur" },
  "Olmazor": { ru: "Алмазар", en: "Almazar" },
  "Sergeli": { ru: "Сергели", en: "Sergeli" },
  "Uchtepa": { ru: "Учтепа", en: "Uchtepa" },
  "Yashnobod": { ru: "Яшнабад", en: "Yashnabad" },
  "Bektemir": { ru: "Бектемир", en: "Bektemir" },
  "Yangihayot": { ru: "Янгиюль", en: "Yangihayot" },
  "Urgut": { ru: "Ургут", en: "Urgut" },
  "Kitob": { ru: "Китаб", en: "Kitab" },
  "Koson": { ru: "Касан", en: "Koson" },
  "Muborak": { ru: "Мубарек", en: "Muborak" },
  "Kattaqo'rg'on": { ru: "Каттакурган", en: "Kattakurgan" },
  "Chirchiq": { ru: "Чирчик", en: "Chirchiq" },
  "Angren": { ru: "Ангрен", en: "Angren" },
  "Olmaliq": { ru: "Алмалык", en: "Almalyk" },
};

export const REGION_NAMES = Object.keys(REGIONS);

/** Localised display name for a stored region/district value. */
export function placeLabel(value: string, locale: Locale): string {
  if (!value || value === "Barchasi") return value;
  if (locale === "uz") return value;
  return LABELS[value]?.[locale] ?? value;
}
