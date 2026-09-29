import { useEffect, useState } from "react";
import { detectLocaleByCoords } from "../utils/detectLocale";
import type { LocaleItem } from "../utils/cultureLocales";

interface Result {
  locale: LocaleItem | null;
  loading: boolean;
  error: string | null;
  level: "city" | "county" | "state" | "none" | null;
  /** Для логов: какие локали пробовали */
  triedQueries: string[];
}

export function useDetectedLocale(
  lat: number | null,
  lng: number | null,
): Result {
  const [locale, setLocale] = useState<LocaleItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<Result["level"]>(null);
  const [triedQueries, setTriedQueries] = useState<string[]>([]);

  useEffect(() => {
    if (lat === null || lng === null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    detectLocaleByCoords(lat, lng)
      .then((res) => {
        if (cancelled) return;
        setLocale(res.locale);
        setLevel(res.level);
        setTriedQueries(res.query ? [res.query] : []);
        if (!res.locale) setError("Локаль не определена");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Ошибка определения локали");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return { locale, loading, error, level, triedQueries };
}
