import { buildMonth, MONTHS_RU, WEEKDAYS_SHORT } from "../utils/dateHelpers";

interface Props {
  year: number;
  month: number;
  today: Date;
  rangeStart: string | null;
  rangeEnd: string | null;
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
      <div className="razerBold text-sm text-[#3a3226] text-center mb-2">
        {MONTHS_RU[month]} {year}
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS_SHORT.map((w) => (
          <div
            key={w}
            className="razer text-center text-[9px] text-gray-400 uppercase"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
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
                "razer h-6 w-6 mx-auto rounded-full text-[11px] transition flex items-center justify-center " +
                (cell.isPast
                  ? "text-gray-300 cursor-not-allowed"
                  : isEndpoint
                    ? "bg-[#8b7355] text-white font-semibold"
                    : inRange
                      ? "bg-[#e8ddc8] text-[#3a3226]"
                      : cell.isToday
                        ? "bg-[#9ca880] text-white"
                        : "text-[#3a3226] hover:bg-[#e8ddc8]")
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
