import { useCallback, useEffect, useRef, useState } from "react";
import { useGeolocation } from "./useGeolocation";
import { detectLocaleByCoords } from "../utils/detectLocale";
import { readLastLocale, saveLastLocale } from "../utils/lastLocale";
import { MOSCOW_LOCALE } from "../utils/fallbackLocale";
import { geocodeCity } from "../utils/geocodeCity";
import type { LocaleItem } from "../utils/cultureLocales";

interface UseMapLocaleResult {
  locale: LocaleItem | null;
  loading: boolean;
  error: string | null;
  showFirstTimeHint: boolean;
  source: "gps" | "cached" | "fallback" | "click" | null;
  setLocaleByCoords: (lat: number, lng: number) => Promise<void>;
  dismissHint: () => void;
  hasGps: boolean;
  userLat: number | null;
  userLng: number | null;
  /** Центр текущей локали — чтобы карта переезжала при смене города */
  center: [number, number] | null;
}

export function useMapLocale(): UseMapLocaleResult {
  const geo = useGeolocation();

  const [locale, setLocale] = useState<LocaleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<UseMapLocaleResult["source"]>(null);
  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);
  const [center, setCenter] = useState<[number, number] | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) void initialize(null, null, false);
    }, 6000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    if (geo.latitude === null || geo.longitude === null) return;
    initializedRef.current = true;
    void initialize(geo.latitude, geo.longitude, true);
  }, [geo.latitude, geo.longitude]);

  async function initialize(
    lat: number | null,
    lng: number | null,
    fromGps: boolean,
  ) {
    setLoading(true);
    setError(null);

    if (fromGps && lat !== null && lng !== null) {
      try {
        const res = await detectLocaleByCoords(lat, lng);
        if (res.locale) {
          saveLastLocale(res.locale);
          setLocale(res.locale);
          setSource("gps");
          // центрируем карту на пользователе
          setCenter([lat, lng]);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("[useMapLocale] GPS-определение не удалось:", e);
      }
    }

    // Кэш последней локали
    const last = readLastLocale();
    if (last) {
      console.log("[useMapLocale] Использую последнюю:", last.title);
      setLocale(last);
      setSource("cached");
      // получаем координаты центра локали по её названию
      const c = await geocodeCity(last.title);
      if (c) setCenter(c);
      setLoading(false);
      return;
    }

    // Fallback — Москва
    console.log("[useMapLocale] Fallback на Москву");
    setLocale(MOSCOW_LOCALE);
    setSource("fallback");
    const c = await geocodeCity(MOSCOW_LOCALE.title);
    if (c) setCenter(c);
    setLoading(false);
    if (!fromGps) setShowFirstTimeHint(true);
  }

  const setLocaleByCoords = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    setShowFirstTimeHint(false);

    try {
      const res = await detectLocaleByCoords(lat, lng);
      if (res.locale) {
        saveLastLocale(res.locale);
        setLocale(res.locale);
        setSource("click");
        // центрируем карту на выбранной точке
        setCenter([lat, lng]);
      } else {
        setError("Не удалось определить город в этой точке");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка определения города");
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissHint = useCallback(() => setShowFirstTimeHint(false), []);

  return {
    locale,
    loading,
    error,
    source,
    showFirstTimeHint,
    dismissHint,
    setLocaleByCoords,
    hasGps: geo.latitude !== null && geo.longitude !== null,
    userLat: geo.latitude,
    userLng: geo.longitude,
    center,
  };
}
