const COORDS_KEY = "culture.ru:event-coords";
// Версия 3: успешные координаты без ts, null-ы с ts
const COORDS_VERSION = 3;
// null перепроверяем раз в 30 дней
const RETRY_NULL_MS = 30 * 24 * 60 * 60 * 1000;

export type Coords = [number, number];

interface CoordsStore {
  version: number;
  /** id → [lng, lat] для успешных */
  coords: Record<string, Coords>;
  /** id → timestamp последней неудачной попытки */
  failed: Record<string, number>;
}

let cache: CoordsStore | null = null;

function load(): CoordsStore {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CoordsStore;
      if (
        parsed?.version === COORDS_VERSION &&
        parsed?.coords &&
        parsed?.failed
      ) {
        cache = parsed;
        return parsed;
      }
      console.log("[coords] Старая версия кэша, сбрасываю");
    }
  } catch (e) {
    console.warn("[coords] Не удалось прочитать кэш:", e);
  }
  const fresh: CoordsStore = {
    version: COORDS_VERSION,
    coords: {},
    failed: {},
  };
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
 * Есть ли запись о координатах.
 * - Успешные — true навсегда.
 * - Неудачные — true, пока не прошло RETRY_NULL_MS.
 */
export function hasEventCoords(eventId: number | string): boolean {
  const store = load();
  const key = String(eventId);
  if (key in store.coords) return true;
  const failedAt = store.failed[key];
  if (failedAt === undefined) return false;
  return Date.now() - failedAt < RETRY_NULL_MS;
}

export function getEventCoords(eventId: number | string): Coords | null {
  const store = load();
  return store.coords[String(eventId)] ?? null;
}

export function setEventCoords(
  eventId: number | string,
  coords: Coords | null,
): void {
  const store = load();
  const key = String(eventId);
  if (coords) {
    store.coords[key] = coords;
    delete store.failed[key];
  } else {
    store.failed[key] = Date.now();
  }
  persist();
}

export function getCoordsCount(): number {
  const store = load();
  return Object.keys(store.coords).length;
}
