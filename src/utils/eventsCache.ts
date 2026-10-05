import type { CultureEvent } from "../types/culture";
import { compactEvents } from "./compactEvents";

const CACHE_PREFIX = "culture.ru:events:";
const CACHE_VERSION = 1;

/** 24 часа. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Сколько событий оставляем, если не влезло всё. */
const FALLBACK_EVENTS_LIMIT = 200;

interface CachePayload {
  version: number;
  locale: string;
  timestamp: number;
  events: CultureEvent[];
}

function keyFor(locale: string): string {
  return `${CACHE_PREFIX}${locale}`;
}

export interface CacheReadResult {
  events: CultureEvent[];
  timestamp: number;
  ageMs: number;
  isFresh: boolean;
}

function isEventActive(event: CultureEvent, now: number): boolean {
  const iso = event.seanceEndDate;
  if (!iso) return true;
  const t = Date.parse(iso);
  if (isNaN(t)) return true;
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  return t >= todayStart.getTime();
}

export function filterActiveEvents(events: CultureEvent[]): CultureEvent[] {
  const now = Date.now();
  return events.filter((e) => isEventActive(e, now));
}

export function readCache(locale: string): CacheReadResult | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(keyFor(locale));
  } catch (e) {
    console.warn("[cache] localStorage недоступен:", e);
    return null;
  }
  if (!raw) return null;

  let parsed: CachePayload;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn("[cache] Не удалось распарсить JSON:", e);
    return null;
  }

  if (
    typeof parsed?.timestamp !== "number" ||
    !Array.isArray(parsed?.events) ||
    parsed?.version !== CACHE_VERSION ||
    parsed?.locale !== locale
  ) {
    console.warn("[cache] Неподходящая структура/версия, игнорирую");
    return null;
  }

  const active = filterActiveEvents(parsed.events);
  if (active.length !== parsed.events.length) {
    console.log(
      `[cache] ${locale}: отфильтровано ${parsed.events.length - active.length} прошедших`,
    );
  }

  const ageMs = Date.now() - parsed.timestamp;
  return {
    events: active,
    timestamp: parsed.timestamp,
    ageMs,
    isFresh: ageMs < CACHE_TTL_MS,
  };
}

export function writeCache(locale: string, events: CultureEvent[]): void {
  const active = filterActiveEvents(events);
  const compact = compactEvents(active);

  const payload: CachePayload = {
    version: CACHE_VERSION,
    locale,
    timestamp: Date.now(),
    events: compact,
  };

  const json = JSON.stringify(payload);
  try {
    localStorage.setItem(keyFor(locale), json);
    console.log(
      `[cache] ${locale}: записано ${active.length} событий, ` +
        `~${Math.round(json.length / 1024)} КБ`,
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn(
        `[cache] ${locale}: квота, обрезаю до ${FALLBACK_EVENTS_LIMIT} событий`,
      );
      payload.events = compact.slice(0, FALLBACK_EVENTS_LIMIT);
      try {
        localStorage.setItem(keyFor(locale), JSON.stringify(payload));
        console.log(
          `[cache] ${locale}: записано ${payload.events.length} (обрезано)`,
        );
      } catch (e2) {
        console.error(
          `[cache] ${locale}: не влезло даже ${FALLBACK_EVENTS_LIMIT}`,
        );
      }
    } else {
      console.warn("[cache] Не удалось записать:", e);
    }
  }
}

export function clearCache(locale: string): void {
  try {
    localStorage.removeItem(keyFor(locale));
    console.log(`[cache] ${locale}: очищено`);
  } catch (e) {
    console.warn("[cache] Не удалось очистить:", e);
  }
}

export function formatAge(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} ч ${m} мин`;
}
