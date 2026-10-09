import { useEffect, useRef, useState } from "react";
import type { CultureEvent } from "../types/culture";
import { SOURCES } from "../config/sources";
import { LOCAL_EVENTS } from "../data/localEvents";
import { fetchGdeChtoEvents } from "../utils/gdeChtoSource";
import { useCultureEvents } from "./useCultureEvents";

interface UseAggregatedEventsResult {
  events: CultureEvent[];
  loading: boolean;
  error: string | null;
  progress: { loaded: number; total: number };
  fromCache: boolean;
  lastUpdated: number | null;
  refresh: (opts?: { force?: boolean }) => void;
  stop: () => void;
  stopped: boolean;
}

/**
 * Оркестратор источников.
 * - local:    всегда, мгновенно, не кэшируется.
 * - gde-chto: всегда, один запрос, не кэшируется.
 * - culture:  по локали, с кэшем, с очередью координат.
 */
export function useAggregatedEvents(
  locale: string | null,
): UseAggregatedEventsResult {
  // culture-хук работает как обычно, но нам нужны только его данные.
  const culture = useCultureEvents(locale);

  // gde-chto: грузим один раз при монтировании и по refresh
  const [gdeEvents, setGdeEvents] = useState<CultureEvent[]>([]);
  const [gdeLoading, setGdeLoading] = useState(false);
  const [gdeError, setGdeError] = useState<string | null>(null);
  const [gdeTick, setGdeTick] = useState(0);

  const gdeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const src = SOURCES.find((s) => s.id === "gde-chto");
    if (!src?.enabled) {
      setGdeEvents([]);
      return;
    }

    gdeAbortRef.current?.abort();
    const ctrl = new AbortController();
    gdeAbortRef.current = ctrl;

    setGdeLoading(true);
    setGdeError(null);

    fetchGdeChtoEvents(ctrl.signal)
      .then((events) => {
        setGdeEvents(events);
        console.log(`[gde-chto] загружено ${events.length} событий`);
      })
      .catch((e) => {
        if (e instanceof Error && e.name === "AbortError") return;
        console.error("[gde-chto] ошибка:", e);
        setGdeError(e instanceof Error ? e.message : "Ошибка gde-chto");
      })
      .finally(() => setGdeLoading(false));

    return () => ctrl.abort();
  }, [gdeTick]);

  // Свойства: local всегда включён
  const localEvents = (() => {
    const src = SOURCES.find((s) => s.id === "local");
    return src?.enabled ? LOCAL_EVENTS : [];
  })();

  // Мердж: local + gde-chto + culture
  const events: CultureEvent[] = [
    ...localEvents,
    ...gdeEvents,
    ...culture.events,
  ];

  // Прогресс и loading — только от culture (у неё долгая загрузка)
  // gde-chto влияет на loading, но не на прогресс-бар.
  const loading = culture.loading || gdeLoading;

  const refresh = (opts?: { force?: boolean }) => {
    culture.refresh(opts);
    setGdeTick((t) => t + 1);
  };

  return {
    events,
    loading,
    error: culture.error ?? gdeError,
    progress: culture.progress, // прогресс только culture
    fromCache: culture.fromCache,
    lastUpdated: culture.lastUpdated,
    refresh,
    stop: culture.stop,
    stopped: culture.stopped,
  };
}
