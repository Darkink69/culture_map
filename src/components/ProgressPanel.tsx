import { useEffect, useReducer } from "react";
import type { CultureEvent } from "../types/culture";
import { hasEventCoords } from "../utils/coordsCache";
import { getQueueSize, onCoordsUpdated } from "../utils/geocodeQueue";

interface Props {
  loading: boolean;
  stopped: boolean;
  error: string | null;
  events: CultureEvent[];
  progress: { loaded: number; total: number };
  fromCache: boolean;
  lastUpdated: number | null;
  /** Название локали для показа в статусе, например "Бердск" */
  localeTitle: string | null;
  onRefresh: () => void;
  onStop: () => void;
}

function formatRelative(ts: number | null): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  return new Date(ts).toLocaleString("ru-RU");
}

export default function ProgressPanel({
  loading,
  stopped,
  error,
  events,
  progress,
  fromCache,
  lastUpdated,
  localeTitle,
  onRefresh,
  onStop,
}: Props) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    const unsub = onCoordsUpdated(() => forceUpdate());
    return () => {
      unsub();
    };
  }, []);

  const total = events.length;
  const queueSize = getQueueSize();
  let resolved = 0;
  for (const e of events) if (hasEventCoords(e._id)) resolved++;

  let percent = 0;
  let statusText = "";

  const label = localeTitle ? `События ${localeTitle}` : "События";

  if (error) {
    statusText = `Ошибка: ${error}`;
  } else if (loading) {
    const pagePct = progress.total > 0 ? progress.loaded / progress.total : 0;
    percent = Math.round(pagePct * 30);
    statusText = `${label} · загрузка афиши...`;
  } else if (stopped) {
    const coordsPct = total > 0 ? resolved / total : 0;
    percent = Math.round(30 + coordsPct * 70);
    statusText = `${label} · остановлено`;
  } else if (total === 0) {
    percent = 100;
    statusText = `${label} · нет событий`;
  } else if (resolved < total) {
    const coordsPct = resolved / total;
    percent = Math.round(30 + coordsPct * 70);
    statusText = `${label} · координаты (${queueSize} в очереди)`;
  } else {
    percent = 100;
    statusText = `${label} · готово`;
    if (fromCache && lastUpdated) {
      statusText += ` · обновлено ${formatRelative(lastUpdated)}`;
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span
            className={
              error
                ? "text-red-600"
                : stopped
                  ? "text-amber-600"
                  : percent === 100
                    ? "text-green-700"
                    : "text-gray-700"
            }
          >
            {statusText}
          </span>
          <span className="font-mono text-xs text-gray-500 tabular-nums">
            {percent}%
          </span>
        </div>

        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={
              "h-full transition-all duration-300 " +
              (error
                ? "bg-red-500"
                : stopped
                  ? "bg-amber-500"
                  : percent === 100
                    ? "bg-green-500"
                    : "bg-blue-500")
            }
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {loading ? (
        <button
          onClick={onStop}
          className="shrink-0 text-xs px-3 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
          title="Остановить загрузку"
        >
          Остановить
        </button>
      ) : (
        <button
          onClick={onRefresh}
          className="shrink-0 text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
          title="Обновить данные"
        >
          Обновить
        </button>
      )}
    </div>
  );
}
