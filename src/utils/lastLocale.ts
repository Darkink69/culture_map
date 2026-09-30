import type { LocaleItem } from "./cultureLocales";

const KEY = "culture.ru:last-locale";

export function saveLastLocale(locale: LocaleItem): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(locale));
    console.log("[lastLocale] Сохранено:", locale.title, locale.sysName);
  } catch (e) {
    console.warn("[lastLocale] Не удалось сохранить:", e);
  }
}

export function readLastLocale(): LocaleItem | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocaleItem;
    if (parsed?.sysName && parsed?.title) return parsed;
    return null;
  } catch (e) {
    console.warn("[lastLocale] Не удалось прочитать:", e);
    return null;
  }
}
