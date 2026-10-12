import { useEffect, useState } from "react";
import { CATEGORY_CONFIG, type EventCategory } from "../utils/eventCategory";
import type { EventFilters } from "../hooks/useEventFilters";
import Calendar from "./Calendar";
// import { toLocalIso } from "../utils/dateHelpers";

interface Props {
  filters: EventFilters;
  onQueryChange: (q: string) => void;
  onToggleCategory: (c: EventCategory) => void;
  onDateChange: (from: string | null, to: string | null) => void;
  onClearDate: () => void;
  onApply: () => void;
  onClose: () => void;
  /** Кол-во событий, попавших под применённые фильтры (для кнопки). */
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

  // Сброс свёрнутого состояния при монтировании
  useEffect(() => {
    setCollapsed(false);
  }, []);

  // Клик по дню
  const handleDayClick = (iso: string) => {
    const { dateFrom, dateTo } = filters;

    // Клик по уже выбранному дню → сброс
    if (dateFrom === iso && dateTo === null) {
      onClearDate();
      return;
    }
    if (dateFrom === iso && dateTo === iso) {
      onClearDate();
      return;
    }

    // Первый клик — задаём начало
    if (dateFrom === null) {
      onDateChange(iso, null);
      return;
    }

    // Второй клик — задаём конец
    if (dateTo === null) {
      if (iso === dateFrom) {
        onDateChange(dateFrom, dateFrom);
      } else if (iso > dateFrom) {
        onDateChange(dateFrom, iso);
      } else {
        // Клик раньше начала — меняем местами
        onDateChange(iso, dateFrom);
      }
      return;
    }

    // Уже есть период — начинаем заново
    onDateChange(iso, null);
  };

  const monthA = { year: today.getFullYear(), month: today.getMonth() };
  const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const monthB = { year: nextDate.getFullYear(), month: nextDate.getMonth() };

  const hasDate = filters.dateFrom !== null || filters.dateTo !== null;

  // --- Мобильный свёрнутый вид ---
  if (isMobile && collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        className="fixed bottom-0 left-0 right-0 h-[20vh] bg-white shadow-2xl rounded-t-2xl z-2000 flex flex-col cursor-pointer"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Поиск</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
          Потяните или нажмите, чтобы раскрыть
        </div>
      </div>
    );
  }

  // --- Полный вид ---
  const panelClass = isMobile
    ? "fixed inset-0 bg-white z-2000 flex flex-col"
    : "fixed top-0 left-0 bottom-0 w-[400px] bg-white shadow-2xl z-2000 flex flex-col";

  return (
    <div className={panelClass}>
      {/* Заголовок */}
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

      {/* Контент — скроллится */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Текстовый поиск */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Поиск
          </label>
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Например: опера, балет, концерт…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <div className={isMobile ? "space-y-4" : "space-y-4"}>
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
            if (isMobile) setCollapsed(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2.5 transition"
        >
          Показать события ({matchedCount})
        </button>
      </div>
    </div>
  );
}
