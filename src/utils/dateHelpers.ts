export interface DayCell {
  date: Date | null;
  iso: string | null;
  day: number | null;
  isPast: boolean;
  isToday: boolean;
}

export function buildMonth(
  year: number,
  month: number, // 0-11
  today: Date,
): DayCell[] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  // 0 = Пн, 6 = Вс
  const firstWeekday = (first.getDay() + 6) % 7;

  const cells: DayCell[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({
      date: null,
      iso: null,
      day: null,
      isPast: false,
      isToday: false,
    });
  }

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    const iso = toLocalIso(date);
    const isPast = date.getTime() < todayStart.getTime();
    const isToday =
      date.getFullYear() === todayStart.getFullYear() &&
      date.getMonth() === todayStart.getMonth() &&
      date.getDate() === todayStart.getDate();
    cells.push({ date, iso, day: d, isPast, isToday });
  }

  return cells;
}

/** ISO-строка без времени, в локальной зоне (YYYY-MM-DD). */
export function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ISO-строка начала сегодняшнего дня. */
export function todayIso(): string {
  return toLocalIso(new Date());
}

export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const MONTHS_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
