import { useEffect, useState } from "react";
import { CATEGORY_CONFIG, type EventCategory } from "../utils/eventCategory";
import type { EventFilters } from "../hooks/useEventFilters";
import Calendar from "./Calendar";

interface Props {
  filters: EventFilters;
  onQueryChange: (q: string) => void;
  onToggleCategory: (c: EventCategory) => void;
  onDateChange: (from: string | null, to: string | null) => void;
  onClearDate: () => void;
  onApply: () => void;
  onClose: () => void;
  matchedCount: number;
}

const ALL_CATEGORIES: EventCategory[] = [
  "spektakli",
  "kontserti",
  "vstrechi",
  "obuchenie",
  "vystavki",
  "other",
];

export default function SearchPanel({
  filters,
  onQueryChange,
  onToggleCategory,
  onDateChange,
  onClearDate,
  onApply,
  onClose,
  matchedCount,
}: Props) {
  const today = new Date();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setCollapsed(false);
  }, []);

  const handleDayClick = (iso: string) => {
    const { dateFrom, dateTo } = filters;

    if (dateFrom === iso && dateTo === null) {
      onClearDate();
      return;
    }
    if (dateFrom === iso && dateTo === iso) {
      onClearDate();
      return;
    }

    if (dateFrom === null) {
      onDateChange(iso, null);
      return;
    }

    if (dateTo === null) {
      if (iso === dateFrom) {
        onDateChange(dateFrom, dateFrom);
      } else if (iso > dateFrom) {
        onDateChange(dateFrom, iso);
      } else {
        onDateChange(iso, dateFrom);
      }
      return;
    }

    onDateChange(iso, null);
  };

  const monthA = { year: today.getFullYear(), month: today.getMonth() };
  const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const monthB = { year: nextDate.getFullYear(), month: nextDate.getMonth() };

  const hasDate = filters.dateFrom !== null || filters.dateTo !== null;

  // --- Мобильный вид: один компонент, анимация через transform ---
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-2000 pointer-events-none"
        aria-hidden={false}
      >
        <div
          className="absolute inset-x-0 bottom-0 bg-white shadow-2xl rounded-t-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-out"
          style={{
            height: "100vh",
            transform: collapsed
              ? "translateY(calc(100% - 5vh))"
              : "translateY(0)",
          }}
        >
          {/* Ручка + заголовок */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer"
            onClick={() => {
              if (collapsed) setCollapsed(false);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
              <span className="text-sm font-medium text-gray-700">
                Поиск событий
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none -mt-1"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          {/* Контент — скроллится */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Поиск с крестиком */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Поиск
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Например: опера, балет, концерт…"
                  className="w-full border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filters.query && (
                  <button
                    onClick={() => onQueryChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                    aria-label="Очистить"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Категории */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Типы событий
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const excluded = filters.excludedCategories.has(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => onToggleCategory(cat)}
                      title={cfg.label}
                      className={
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg transition border-2 " +
                        (excluded
                          ? "bg-gray-200 border-gray-300 opacity-50 grayscale"
                          : "border-white shadow")
                      }
                      style={excluded ? undefined : { background: cfg.color }}
                    >
                      <span>{cfg.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Даты */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-500">
                  Даты
                </label>
                {hasDate && (
                  <button
                    onClick={onClearDate}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Сбросить даты
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <Calendar
                  year={monthA.year}
                  month={monthA.month}
                  today={today}
                  rangeStart={filters.dateFrom}
                  rangeEnd={filters.dateTo}
                  onDayClick={handleDayClick}
                />
                <Calendar
                  year={monthB.year}
                  month={monthB.month}
                  today={today}
                  rangeStart={filters.dateFrom}
                  rangeEnd={filters.dateTo}
                  onDayClick={handleDayClick}
                />
              </div>
            </div>
          </div>

          {/* Кнопка */}
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={() => {
                onApply();
                setCollapsed(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2.5 transition"
            >
              Показать события ({matchedCount})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Десктопный вид ---
  return (
    <div className="fixed top-0 left-0 bottom-0 w-100 bg-white shadow-2xl z-2000 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Поиск событий</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Поиск
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Например: опера, балет, концерт…"
              className="w-full border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filters.query && (
              <button
                onClick={() => onQueryChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100"
                aria-label="Очистить"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Типы событий
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const excluded = filters.excludedCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => onToggleCategory(cat)}
                  title={cfg.label}
                  className={
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg transition border-2 " +
                    (excluded
                      ? "bg-gray-200 border-gray-300 opacity-50 grayscale"
                      : "border-white shadow")
                  }
                  style={excluded ? undefined : { background: cfg.color }}
                >
                  <span>{cfg.emoji}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-500">
              Даты
            </label>
            {hasDate && (
              <button
                onClick={onClearDate}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Сбросить даты
              </button>
            )}
          </div>
          <div className="space-y-4">
            <Calendar
              year={monthA.year}
              month={monthA.month}
              today={today}
              rangeStart={filters.dateFrom}
              rangeEnd={filters.dateTo}
              onDayClick={handleDayClick}
            />
            <Calendar
              year={monthB.year}
              month={monthB.month}
              today={today}
              rangeStart={filters.dateFrom}
              rangeEnd={filters.dateTo}
              onDayClick={handleDayClick}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={onApply}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2.5 transition"
        >
          Показать события ({matchedCount})
        </button>
      </div>
    </div>
  );
}
