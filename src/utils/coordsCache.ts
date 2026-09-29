const COORDS_KEY = "culture.ru:event-coords";
const COORDS_VERSION = 1;

export type Coords = [number, number];

interface CoordsStore {
  version: number;
  /** eventId → [lng, lat] или null (не нашли) */
  coords: Record<string, Coords | null>;
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
    console.warn("[coords] Не удалось записать:", e);
  }
}

export function hasEventCoords(eventId: number | string): boolean {
  const store = load();
  return String(eventId) in store.coords;
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
  store.coords[String(eventId)] = coords;
  persist();
}

export function getCoordsCount(): number {
  const store = load();
  let n = 0;
  for (const v of Object.values(store.coords)) if (v) n++;
  return n;
}
