const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "culture-map-app/1.0 (educational project)";

export interface ReverseGeoResult {
  city: string | null; // город, посёлок
  town: string | null;
  village: string | null;
  county: string | null; // район
  state: string | null; // область
}

/**
 * Обратный геокодер Nominatim.
 * Возвращает структурированные компоненты адреса.
 * zoom: 10 — город, 8 — район, 6 — область.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  zoom = 10,
): Promise<ReverseGeoResult | null> {
  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", String(zoom));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "ru");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    return {
      city: a.city ?? null,
      town: a.town ?? null,
      village: a.village ?? null,
      county: a.county ?? null,
      state: a.state ?? null,
    };
  } catch (e) {
    console.warn("[reverse] Ошибка:", e);
    return null;
  }
}
