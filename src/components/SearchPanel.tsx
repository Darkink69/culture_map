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
  "kontserti",
  "spektakli",
  "vstrechi",
  "obuchenie",
  "vystavki",
  "other",
];

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

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
      window.matchMedia("(max-width: 1023px)").matches,
  );
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
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
      if (iso === dateFrom) onDateChange(dateFrom, dateFrom);
      else if (iso > dateFrom) onDateChange(dateFrom, iso);
      else onDateChange(iso, dateFrom);
      return;
    }
    onDateChange(iso, null);
  };

  const monthA = { year: today.getFullYear(), month: today.getMonth() };
  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const monthB = { year: next.getFullYear(), month: next.getMonth() };

  const hasDate = filters.dateFrom !== null || filters.dateTo !== null;

  const Header = (
    <div className="flex items-center justify-between px-5 pt-5 pb-4">
      <div className="flex items-center gap-3">
        <img src="/icons/harp.svg" alt="" className="w-9 h-9" />
        <h2 className="razerBold text-2xl text-[#3a3226]">Поиск событий</h2>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="text-gray-500 hover:text-gray-800 p-1"
        aria-label="Закрыть"
      >
        <CloseIcon />
      </button>
    </div>
  );

  const SearchInput = (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={filters.query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Например: опера, балет, концерт…"
        className="razer w-full bg-white border-0 rounded-2xl pl-11 pr-10 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c9b48a]"
      />
      {filters.query && (
        <button
          onClick={() => onQueryChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          aria-label="Очистить"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );

  const CategoriesRow = (
    <div className="flex justify-between gap-0.5">
      {ALL_CATEGORIES.map((cat) => {
        const cfg = CATEGORY_CONFIG[cat];
        const excluded = filters.excludedCategories.has(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggleCategory(cat)}
            className="flex flex-col items-center gap-2 flex-1 min-w-0 group"
            title={cfg.label}
          >
            <div
              className={
                "w-14 h-14 rounded-full flex items-center justify-center transition " +
                (excluded ? "opacity-40 grayscale" : "")
              }
            >
              <img src={cfg.icon} alt="" className="w-20 h-20" />
            </div>
            <span
              className={
                "razer text-[10px] leading-tight text-center transition truncate w-full " +
                (excluded ? "text-gray-400" : "text-gray-700")
              }
            >
              {cfg.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  const DatesRow = (
    <div className="grid grid-cols-2 gap-3">
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
  );

  const FooterButton = (
    <button
      onClick={() => {
        onApply();
        if (isMobile) setCollapsed(true);
      }}
      className="razerBold w-full bg-[#7a8ba3] hover:bg-[#6b7c94] text-white text-base rounded-2xl py-3.5 transition shadow-sm"
    >
      Показать события ({matchedCount})
    </button>
  );

  const Content = (
    <>
      {Header}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">
        <div>
          <div className="razer text-md tracking-widest uppercase text-gray-500 mb-2">
            Поиск
          </div>
          {SearchInput}
        </div>

        <div>
          <div className="razer text-md tracking-widest uppercase text-gray-500 mb-3">
            Типы событий
          </div>
          {CategoriesRow}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="razer text-md tracking-widest uppercase text-gray-500">
              Дата
            </div>
            {hasDate && (
              <button
                onClick={onClearDate}
                className="razer text-[11px] text-[#8b7355] hover:text-[#3a3226]"
              >
                Сбросить
              </button>
            )}
          </div>
          {DatesRow}
        </div>
      </div>

      <div className="px-5 pb-5 pt-2 border-t border-[#e8e0d2]">
        {FooterButton}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-2000 pointer-events-none">
        <div
          className="absolute inset-x-0 bottom-0 bg-[#f5f1ea] rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-out"
          style={{
            height: "100vh",
            transform: collapsed
              ? "translateY(calc(100% - 10vh))"
              : "translateY(0)",
          }}
        >
          {Header}
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">
            <div>
              <div className="razer text-[11px] tracking-widest uppercase text-gray-500 mb-2">
                Поиск
              </div>
              {SearchInput}
            </div>

            <div>
              <div className="razer text-[11px] tracking-widest uppercase text-gray-500 mb-3">
                Типы событий
              </div>
              {CategoriesRow}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="razer text-[11px] tracking-widest uppercase text-gray-500">
                  Дата
                </div>
                {hasDate && (
                  <button
                    onClick={onClearDate}
                    className="razer text-[11px] text-[#8b7355] hover:text-[#3a3226]"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <div className="space-y-5">
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

          <div className="px-5 pb-5 pt-2 border-t border-[#e8e0d2]">
            {FooterButton}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 bottom-0 w-145 max-w-full bg-[#f5f1ea] shadow-2xl z-2000 flex flex-col">
      {Content}
    </div>
  );
}
