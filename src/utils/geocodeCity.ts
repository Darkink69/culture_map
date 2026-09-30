const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "culture-map-app/1.0 (educational project)";

/** Пауза между запросами к Nominatim — 1.1 с. */
let lastRequestAt = 0;

async function waitForSlot(): Promise<void> {
  const since = Date.now() - lastRequestAt;
  const wait = Math.max(0, 1100 - since);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/**
 * Находит координаты [lat, lng] города по его названию.
 * Возвращает [lat, lng] — порядок как ожидает Leaflet.
 */
export async function geocodeCity(
  cityName: string,
): Promise<[number, number] | null> {
  await waitForSlot();

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", cityName);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ru");
  url.searchParams.set("accept-language", "ru");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
      console.warn(`[geocodeCity] HTTP ${res.status} для "${cityName}"`);
      return null;
    }
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) {
      console.warn(`[geocodeCity] Ничего не найдено для "${cityName}"`);
      return null;
    }
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    console.log(`[geocodeCity] "${cityName}" → [${lat}, ${lng}]`);
    return [lat, lng];
  } catch (e) {
    console.warn(`[geocodeCity] Ошибка для "${cityName}":`, e);
    return null;
  }
}
