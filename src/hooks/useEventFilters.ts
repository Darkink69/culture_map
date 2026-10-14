import { useCallback, useMemo, useState } from "react";
import type { CultureEvent } from "../types/culture";
import type { EventCategory } from "../utils/eventCategory";
import { getEventCategory } from "../utils/eventCategory";
import { eventSearchText, matchesQuery } from "../utils/textSearch";
import { todayIso } from "../utils/dateHelpers";

export interface EventFilters {
  query: string;
  excludedCategories: Set<EventCategory>;
  dateFrom: string | null;
  dateTo: string | null;
}

export const EMPTY_FILTERS: EventFilters = {
  query: "",
  excludedCategories: new Set(),
  dateFrom: null,
  dateTo: null,
};

/**
 * Возвращает [start, end] активности события в ISO (YYYY-MM-DD).
 * - culture: [сегодня, seanceEndDate]
 * - gde-chto: [dateFrom, seanceEndDate]
 * - local: [dateFrom ?? сегодня, seanceEndDate]
 * null означает «не знаем».
 */
function getEventDateRange(event: CultureEvent): {
  start: string | null;
  end: string | null;
} {
  const src = event.source ?? "culture";

  const endIso = event.seanceEndDate ? event.seanceEndDate.slice(0, 10) : null;

  if (src === "gde-chto") {
    const startIso = event.dateFrom ? event.dateFrom.slice(0, 10) : null;
    return { start: startIso, end: endIso };
  }

  // culture и local: если нет dateFrom — считаем, что событие активно с сегодня
  const startIso = event.dateFrom ? event.dateFrom.slice(0, 10) : todayIso();

  return { start: startIso, end: endIso };
}

function isInDateRange(
  event: CultureEvent,
  fromIso: string | null,
  toIso: string | null,
): boolean {
  if (fromIso === null && toIso === null) return true;

  const { start, end } = getEventDateRange(event);

  // Если у события нет дат вообще — не фильтруем
  if (start === null && end === null) return true;

  const s = start ?? end!;
  const e = end ?? start!;

  const lo = fromIso ?? "0000-01-01";
  const hi = toIso ?? "9999-12-31";

  // Пересечение [s, e] с [lo, hi] — строковое сравнение работает для ISO
  return s <= hi && e >= lo;
}

export function filterEvents(
  events: CultureEvent[],
  filters: EventFilters,
): CultureEvent[] {
  const query = filters.query.trim();

  return events.filter((event) => {
    const cat = getEventCategory(event);
    if (filters.excludedCategories.has(cat)) return false;

    if (!isInDateRange(event, filters.dateFrom, filters.dateTo)) return false;

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

  const apply = useCallback(() => setApplied(filters), [filters]);

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

  const hasActiveFilter = useMemo(
    () =>
      applied.query.trim() !== "" ||
      applied.excludedCategories.size > 0 ||
      applied.dateFrom !== null ||
      applied.dateTo !== null,
    [applied],
  );

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
