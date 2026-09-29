import { reverseGeocode } from "./reverseGeocode";
import { findLocales, type LocaleItem } from "./cultureLocales";

export interface DetectResult {
  locale: LocaleItem | null;
  /** Как мы дошли до этого результата: city / county / state / none */
  level: "city" | "county" | "state" | "none";
  /** Что именно искали в culture.ru */
  query: string | null;
}

const ZOOM_LEVELS: Array<{ zoom: number; level: DetectResult["level"] }> = [
  { zoom: 10, level: "city" },
  { zoom: 8, level: "county" },
  { zoom: 6, level: "state" },
];

/** Пауза между запросами к Nominatim — 1.1 с. */
const DELAY_MS = 1100;

export async function detectLocaleByCoords(
  lat: number,
  lng: number,
): Promise<DetectResult> {
  console.log("[detect] Начинаю определение локали по GPS:", lat, lng);

  for (const { zoom, level } of ZOOM_LEVELS) {
    const geo = await reverseGeocode(lat, lng, zoom);
    if (!geo) {
      console.warn(`[detect] Nominatim (zoom=${zoom}) ничего не вернул`);
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    // Пробуем несколько кандидатов на этом уровне: город → посёлок → село → район → область
    const candidates: string[] = [];
    if (level === "city") {
      if (geo.city) candidates.push(geo.city);
      if (geo.town) candidates.push(geo.town);
      if (geo.village) candidates.push(geo.village);
    } else if (level === "county") {
      if (geo.county) candidates.push(geo.county);
    } else {
      if (geo.state) candidates.push(geo.state);
    }

    console.log(`[detect] zoom=${zoom} (${level}) → кандидаты:`, candidates);

    for (const q of candidates) {
      const locales = await findLocales(q);
      if (locales.length > 0) {
        console.log(`[detect] Найдена локаль "${q}" →`, locales[0]);
        return { locale: locales[0], level, query: q };
      }
      console.log(`[detect] "${q}" не дал локалей, пробую следующего`);
      await new Promise((r) => setTimeout(r, 400));
    }

    // Пауза перед следующим зумом
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.warn("[detect] Не удалось определить локаль");
  return { locale: null, level: "none", query: null };
}
