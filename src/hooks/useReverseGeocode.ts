import { useEffect, useRef, useState } from "react";

export interface ReverseGeocodeResult {
  displayName: string;
  shortName: string;
  address: {
    country?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    road?: string;
    houseNumber?: string;
    postcode?: string;
  };
  category: string;
  type: string;
  lat: number;
  lng: number;
  osmUrl: string;
  raw: unknown;
}

interface State {
  data: ReverseGeocodeResult | null;
  loading: boolean;
  error: string | null;
}

/**
 * В проде /nominatim/ проксируется nginx на nominatim.openstreetmap.org.
 * В деве Vite проксирует то же самое (см. vite.config.ts).
 * В обоих случаях URL относительный — new URL требует базу, поэтому
 * используем window.location.origin.
 */
const NOMINATIM = "/nominatim/reverse";

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { ts: number; data: ReverseGeocodeResult }>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function useReverseGeocode(
  lat: number | null,
  lng: number | null,
): State {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (lat === null || lng === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const key = cacheKey(lat, lng);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setState({ data: cached.data, loading: false, error: null });
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        // ВАЖНО: new URL с относительным путём требует base
        const url = new URL(NOMINATIM, window.location.origin);
        url.searchParams.set("lat", String(lat));
        url.searchParams.set("lon", String(lng));
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("accept-language", "ru");
        url.searchParams.set("zoom", "18");

        console.log(`[nominatim] GET ${url.toString()}`);

        const res = await fetch(url.toString(), {
          signal: ctrl.signal,
          headers: { "Accept-Language": "ru" },
        });
        if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

        const json = (await res.json()) as {
          display_name?: string;
          name?: string;
          address?: Record<string, string>;
          category?: string;
          type?: string;
          lat?: string;
          lon?: string;
          osm_type?: string;
          osm_id?: number;
          error?: string;
        };

        if (json.error) throw new Error(json.error);
        if (!json || !json.display_name) throw new Error("Адрес не найден");

        const addr = json.address ?? {};
        const shortName =
          json.name ||
          addr.road ||
          addr.suburb ||
          addr.city ||
          addr.town ||
          addr.village ||
          json.display_name.split(",")[0];

        const result: ReverseGeocodeResult = {
          displayName: json.display_name,
          shortName,
          address: {
            country: addr.country,
            state: addr.state,
            city: addr.city,
            town: addr.town,
            village: addr.village,
            suburb: addr.suburb,
            road: addr.road,
            houseNumber: addr.house_number,
            postcode: addr.postcode,
          },
          category: json.category ?? "place",
          type: json.type ?? "unknown",
          lat: Number(json.lat ?? lat),
          lng: Number(json.lon ?? lng),
          osmUrl:
            json.osm_type && json.osm_id
              ? `https://www.openstreetmap.org/${json.osm_type}/${json.osm_id}`
              : `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`,
          raw: json,
        };

        cache.set(key, { ts: Date.now(), data: result });
        setState({ data: result, loading: false, error: null });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        console.error("[nominatim] ошибка:", e);
        setState({
          data: null,
          loading: false,
          error: e instanceof Error ? e.message : "Ошибка геокодера",
        });
      }
    })();

    return () => ctrl.abort();
  }, [lat, lng]);

  return state;
}
