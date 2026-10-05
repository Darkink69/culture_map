const COORDS_KEY = "culture.ru:event-coords";
// Версия 2: схема {v, ts}. Старые null-ы инвалидируются автоматически.
const COORDS_VERSION = 2;
// null перепроверяем раз в 6 часов
const RETRY_NULL_MS = 6 * 60 * 60 * 1000;

export type Coords = [number, number];

interface CoordsEntry {
  v: Coords | null;
  ts: number;
}

interface CoordsStore {
  version: number;
  /** eventId → { v: [lng, lat] | null, ts: timestamp } */
  coords: Record<string, CoordsEntry>;
}

let cache: CoordsStore | null = null;

function load(): CoordsStore {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CoordsStore;
      if (parsed?.version === COORDS_VERSION && parsed?.coords) {
        cache = parsed;
        return parsed;
      }
      console.warn("[coords] Старая версия кэша, сбрасываю");
    }
  } catch (e) {
    console.warn("[coords] Не удалось прочитать кэш:", e);
  }
  const fresh: CoordsStore = { version: COORDS_VERSION, coords: {} };
  cache = fresh;
  return fresh;
}

function persist(): void {
  if (!cache) return;
  try {
    localStorage.setItem(COORDS_KEY, JSON.stringify(cache));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("[coords] Квота — чищу кэш афиши (события восстановимы)");
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("culture.ru:events:")) toRemove.push(k);
      }
      for (const k of toRemove) localStorage.removeItem(k);
      try {
        localStorage.setItem(COORDS_KEY, JSON.stringify(cache));
        console.log("[coords] После чистки афиши координаты записаны");
      } catch {
        console.error("[coords] Даже после чистки не влезло");
      }
    } else {
      console.warn("[coords] Не удалось записать:", e);
    }
  }
}

/**
 * Есть ли актуальная запись о координатах.
 * null считается валидным только пока не устарел (RETRY_NULL_MS).
 */
export function hasEventCoords(eventId: number | string): boolean {
  const store = load();
  const entry = store.coords[String(eventId)];
  if (!entry) return false;
  if (entry.v) return true;
  return Date.now() - entry.ts < RETRY_NULL_MS;
}

export function getEventCoords(eventId: number | string): Coords | null {
  const store = load();
  return store.coords[String(eventId)]?.v ?? null;
}

export function setEventCoords(
  eventId: number | string,
  coords: Coords | null,
): void {
  const store = load();
  store.coords[String(eventId)] = { v: coords, ts: Date.now() };
  persist();
}

export function getCoordsCount(): number {
  const store = load();
  let n = 0;
  for (const v of Object.values(store.coords)) if (v.v) n++;
  return n;
}
