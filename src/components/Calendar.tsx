import {
  buildMonth,
  MONTHS_RU,
  WEEKDAYS_SHORT,
  //   type DayCell,
} from "../utils/dateHelpers";

interface Props {
  year: number;
  month: number; // 0-11
  today: Date;
  /** ISO выбранных дат (начало и конец периода). */
  rangeStart: string | null;
  rangeEnd: string | null;
  /** Клик по дню. */
  onDayClick: (iso: string) => void;
}

function isInRange(
  iso: string,
  start: string | null,
  end: string | null,
): boolean {
  if (!start && !end) return false;
  const lo = start && end ? (start < end ? start : end) : (start ?? end)!;
  const hi = start && end ? (start < end ? end : start) : (start ?? end)!;
  return iso >= lo && iso <= hi;
}

export default function Calendar({
  year,
  month,
  today,
  rangeStart,
  rangeEnd,
  onDayClick,
}: Props) {
  const cells = buildMonth(year, month, today);

  return (
    <div className="select-none">
      <div className="text-sm font-medium text-gray-800 mb-2 text-center">
        {MONTHS_RU[month]} {year}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-[10px] text-gray-400 mb-1">
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className="text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          if (!cell.day) return <div key={i} />;

          const inRange = cell.iso
            ? isInRange(cell.iso, rangeStart, rangeEnd)
            : false;
          const isEndpoint =
            cell.iso !== null &&
            (cell.iso === rangeStart || cell.iso === rangeEnd);

          return (
            <button
              key={i}
              disabled={cell.isPast}
              onClick={() => cell.iso && onDayClick(cell.iso)}
              className={
                "h-8 w-8 mx-auto rounded text-xs transition " +
                (cell.isPast
                  ? "text-gray-300 cursor-not-allowed"
                  : isEndpoint
                    ? "bg-blue-600 text-white font-semibold"
                    : inRange
                      ? "bg-blue-100 text-blue-800"
                      : cell.isToday
                        ? "border border-blue-400 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100")
              }
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
