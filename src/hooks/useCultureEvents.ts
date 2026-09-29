import { useEffect, useRef, useState } from "react";
import type { CultureEvent, EventsResponse } from "../types/culture";
import {
  readCache,
  writeCache,
  formatAge,
  CACHE_TTL_MS,
} from "../utils/eventsCache";
import { hasEventCoords } from "../utils/coordsCache";
import { enqueueEventCoords } from "../utils/geocodeQueue";

const BASE = "/culture";
const PAGE_SIZE = 100;
const MAX_PAGES_HARD_LIMIT = 100;
const REQUEST_DELAY_MS = 200;

const LOG_PREFIX = "[culture.ru]";
const log = (...a: unknown[]) => console.log(LOG_PREFIX, ...a);
const logWarn = (...a: unknown[]) => console.warn(LOG_PREFIX, ...a);
const logError = (...a: unknown[]) => console.error(LOG_PREFIX, ...a);

async function fetchBuildId(): Promise<string> {
  const res = await fetch(`${BASE}/`, { credentials: "omit" });
  if (!res.ok) throw new Error(`Главная: HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/"buildId"\s*:\s*"([^"]+)"/);
  if (match) return match[1];
  const alt = html.match(/\\"buildId\\"\s*:\s*\\"([^"\\]+)\\"/);
  if (alt) return alt[1];
  throw new Error("buildId не найден в HTML");
}

interface PageResult {
  items: CultureEvent[];
  totalPages: number | null;
}

async function fetchPage(
  buildId: string,
  locale: string,
  page: number,
  signal?: AbortSignal,
): Promise<PageResult> {
  const url = new URL(
    `${BASE}/_next/data/${buildId}/afisha/${locale}.json`,
    window.location.origin,
  );
  url.searchParams.set("locale", locale);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));

  log(`Афиша "${locale}", стр. ${page}:`, url.toString());

  const res = await fetch(url.toString(), { credentials: "omit", signal });
  if (!res.ok) throw new Error(`Афиша стр. ${page}: HTTP ${res.status}`);

  const json: EventsResponse = await res.json();
  const events = json?.pageProps?.events;
  if (!events) throw new Error(`Афиша стр. ${page}: нет pageProps.events`);

  const items = events.items ?? [];
  const totalPages =
    typeof events.pagination?.total === "number"
      ? events.pagination.total
      : null;

  log(
    `"${locale}" стр. ${page}: items=${items.length}, ` +
      `событий=${events.total}, страниц=${totalPages}`,
  );

  return { items, totalPages };
}

// ---------------------------------------------------------------------------
// Синглтон на локаль
// ---------------------------------------------------------------------------
const inFlight = new Map<string, Promise<CultureEvent[]>>();
const aborters = new Map<string, AbortController>();

interface LoadOptions {
  force?: boolean;
  maxPages?: number;
  onPartial?: (events: CultureEvent[]) => void;
  onProgress?: (loadedPages: number, totalPages: number) => void;
  onStop?: () => void;
}

async function loadAllEvents(
  locale: string,
  opts: LoadOptions = {},
): Promise<CultureEvent[]> {
  const { force = false, maxPages, onPartial, onProgress, onStop } = opts;

  const existing = inFlight.get(locale);
  if (existing) {
    log(`"${locale}" загрузка уже идёт — присоединяюсь`);
    return existing;
  }

  const controller = new AbortController();
  aborters.set(locale, controller);
  const signal = controller.signal;

  const promise = (async () => {
    const t0 = performance.now();

    if (!force) {
      const cached = readCache(locale);
      if (cached) {
        log(
          `"${locale}" кэш: возраст ${formatAge(cached.ageMs)}, ` +
            `свежий (< ${formatAge(CACHE_TTL_MS)}): ${cached.isFresh}, ` +
            `событий: ${cached.events.length}`,
        );
        if (cached.isFresh) {
          log(`"${locale}" использую кэш`);
          onPartial?.(cached.events);
          const queued = enqueueMissing(cached.events);
          if (queued > 0) log(`В очередь координат из кэша: ${queued}`);
          return cached.events;
        }
        log(`"${locale}" кэш устарел — обновляю`);
      } else {
        log(`"${locale}" кэша нет — гружу из сети`);
      }
    } else {
      log(`"${locale}" форсированное обновление`);
    }

    const buildId = await fetchBuildId();
    log("buildId =", buildId);

    // Первая страница
    const first = await fetchPage(buildId, locale, 1, signal);
    const all: CultureEvent[] = [...first.items];
    enqueueMissing(all);
    writeCache(locale, all);
    onPartial?.([...all]);

    let totalPages =
      typeof maxPages === "number" ? maxPages : (first.totalPages ?? 1);
    totalPages = Math.min(totalPages, MAX_PAGES_HARD_LIMIT);
    onProgress?.(1, totalPages);
    log(`"${locale}" всего страниц: ${totalPages}`);

    for (let page = 2; page <= totalPages; page++) {
      if (signal.aborted) {
        log(`"${locale}" abort на странице ${page}`);
        onStop?.();
        break;
      }

      try {
        const { items } = await fetchPage(buildId, locale, page, signal);
        if (items.length === 0) {
          log(`"${locale}" страница ${page} пуста — стоп`);
          break;
        }
        all.push(...items);
        enqueueMissing(items);
        writeCache(locale, all);
        onPartial?.([...all]);
        onProgress?.(page, totalPages);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          log(`"${locale}" abort при загрузке стр. ${page}`);
          onStop?.();
          break;
        }
        logWarn(`"${locale}" стр. ${page} упала:`, e);
      }
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    }

    const t1 = performance.now();
    log(
      `=== "${locale}" афиша загружена === ` +
        `событий: ${all.length}, время: ${Math.round(t1 - t0)} мс`,
    );
    return all;
  })();

  inFlight.set(locale, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(locale);
    aborters.delete(locale);
  }
}

function enqueueMissing(events: CultureEvent[]): number {
  let n = 0;
  for (const ev of events) {
    if (hasEventCoords(ev._id)) continue;
    enqueueEventCoords(ev._id, "", "");
    n++;
  }
  return n;
}

/** Остановить загрузку для локали. */
export function stopLoading(locale: string): void {
  const ctrl = aborters.get(locale);
  if (ctrl) {
    console.log(`[culture.ru] Останавливаю загрузку для "${locale}"`);
    ctrl.abort();
  }
}

// ---------------------------------------------------------------------------
// Хук
// ---------------------------------------------------------------------------
interface UseEventsResult {
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

export function useCultureEvents(
  locale: string | null,
  maxPages?: number,
): UseEventsResult {
  const [events, setEvents] = useState<CultureEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [fromCache, setFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [stopped, setStopped] = useState(false);

  const forceRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!locale) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }

    const force = forceRef.current;
    forceRef.current = false;
    setStopped(false);

    if (!force) {
      const cached = readCache(locale);
      if (cached?.events?.length) {
        setEvents(cached.events);
        setFromCache(true);
        setLastUpdated(cached.timestamp);
      }
    }

    setLoading(true);
    setError(null);

    loadAllEvents(locale, {
      force,
      maxPages,
      onPartial: (partial) => {
        if (!mountedRef.current) return;
        setEvents(partial);
        setFromCache(false);
      },
      onProgress: (loaded, total) => {
        if (!mountedRef.current) return;
        setProgress({ loaded, total });
      },
      onStop: () => {
        if (!mountedRef.current) return;
        setStopped(true);
        setLoading(false);
      },
    })
      .then((result) => {
        if (!mountedRef.current) return;
        setEvents(result);
        setLastUpdated(Date.now());
        setFromCache(false);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        if (err instanceof Error && err.name === "AbortError") {
          setStopped(true);
          return;
        }
        logError("Ошибка:", err);
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, [locale, maxPages, reloadTick]);

  const refresh = (opts?: { force?: boolean }) => {
    if (opts?.force) forceRef.current = true;
    setReloadTick((t) => t + 1);
  };

  const stop = () => {
    if (locale) stopLoading(locale);
  };

  return {
    events,
    loading,
    error,
    progress,
    fromCache,
    lastUpdated,
    refresh,
    stop,
    stopped,
  };
}
