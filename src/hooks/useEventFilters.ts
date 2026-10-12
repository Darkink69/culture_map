import { useCallback, useMemo, useState } from "react";
import type { CultureEvent } from "../types/culture";
import type { EventCategory } from "../utils/eventCategory";
import { getEventCategory } from "../utils/eventCategory";
import { eventSearchText, matchesQuery } from "../utils/textSearch";

export interface EventFilters {
  query: string;
  /** Исключённые категории. Пустой Set = все включены. */
  excludedCategories: Set<EventCategory>;
  /** Начало периода (включительно), ISO или null. */
  dateFrom: string | null;
  /** Конец периода (включительно), ISO или null. */
  dateTo: string | null;
}

export const EMPTY_FILTERS: EventFilters = {
  query: "",
  excludedCategories: new Set(),
  dateFrom: null,
  dateTo: null,
};

function getEventDateRange(event: CultureEvent): {
  start: number | null;
  end: number | null;
} {
  // culture: только seanceEndDate
  if ((event.source ?? "culture") === "culture") {
    const end = event.seanceEndDate ? Date.parse(event.seanceEndDate) : null;
    return { start: end, end };
  }
  // gde-chto: dateFrom + seanceEndDate
  if (event.source === "gde-chto") {
    const start = event.dateFrom ? Date.parse(event.dateFrom) : null;
    const end = event.seanceEndDate ? Date.parse(event.seanceEndDate) : null;
    return { start, end };
  }
  // local: только seanceEndDate (если есть)
  const end = event.seanceEndDate ? Date.parse(event.seanceEndDate) : null;
  return { start: end, end };
}

function isInDateRange(
  event: CultureEvent,
  fromTs: number | null,
  toTs: number | null,
): boolean {
  if (fromTs === null && toTs === null) return true;

  const { start, end } = getEventDateRange(event);

  // Если у события нет дат — не фильтруем по дате (показываем всегда)
  if (start === null && end === null) return true;

  const s = start ?? end!;
  const e = end ?? start!;

  const lo = fromTs ?? -Infinity;
  const hi = toTs ?? Infinity;

  // Пересечение [s, e] с [lo, hi]
  return s <= hi && e >= lo;
}

export function filterEvents(
  events: CultureEvent[],
  filters: EventFilters,
): CultureEvent[] {
  const query = filters.query.trim();
  const fromTs = filters.dateFrom ? Date.parse(filters.dateFrom) : null;
  const toTs = filters.dateTo ? Date.parse(filters.dateTo) : null;

  return events.filter((event) => {
    // 1. Категория
    const cat = getEventCategory(event);
    if (filters.excludedCategories.has(cat)) return false;

    // 2. Дата
    if (!isInDateRange(event, fromTs, toTs)) return false;

    // 3. Текст
    if (query) {
      const text = eventSearchText(event);
      if (!matchesQuery(text, query)) return false;
    }

    return true;
  });
}

export function useEventFilters() {
  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<EventFilters>(EMPTY_FILTERS);
  const [isOpen, setIsOpen] = useState(false);

  const apply = useCallback(() => {
    setApplied(filters);
  }, [filters]);

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }, []);

  const toggleCategory = useCallback((cat: EventCategory) => {
    setFilters((f) => {
      const next = new Set(f.excludedCategories);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return { ...f, excludedCategories: next };
    });
  }, []);

  const setQuery = useCallback((query: string) => {
    setFilters((f) => ({ ...f, query }));
  }, []);

  const setDateFrom = useCallback((dateFrom: string | null) => {
    setFilters((f) => ({ ...f, dateFrom }));
  }, []);

  const setDateTo = useCallback((dateTo: string | null) => {
    setFilters((f) => ({ ...f, dateTo }));
  }, []);

  const clearDate = useCallback(() => {
    setFilters((f) => ({ ...f, dateFrom: null, dateTo: null }));
  }, []);

  const hasActiveFilter = useMemo(() => {
    return (
      applied.query.trim() !== "" ||
      applied.excludedCategories.size > 0 ||
      applied.dateFrom !== null ||
      applied.dateTo !== null
    );
  }, [applied]);

  return {
    filters,
    applied,
    isOpen,
    hasActiveFilter,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    apply,
    reset,
    toggleCategory,
    setQuery,
    setDateFrom,
    setDateTo,
    clearDate,
  };
}
