import { useEffect, useReducer, useState } from "react";
import type { CultureEvent } from "../types/culture";
import { hasEventCoords } from "../utils/coordsCache";
import { onCoordsUpdated } from "../utils/geocodeQueue";

interface Props {
  loading: boolean;
  stopped: boolean;
  error: string | null;
  events: CultureEvent[];
  progress: { loaded: number; total: number };
  fromCache: boolean;
  lastUpdated: number | null;
  localeTitle: string | null;
  onRefresh: () => void;
  onStop: () => void;
  /** Показывать служебные кнопки (для ?debug=1). */
  debug?: boolean;
}

const COLLAPSED_KEY = "culture.ru:progress-collapsed";
const HIDE_DELAY_MS = 2000;

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

interface StatusInfo {
  percent: number;
  statusText: string;
  tone: "error" | "stopped" | "done" | "progress";
}

function computeStatus(
  loading: boolean,
  stopped: boolean,
  error: string | null,
  events: CultureEvent[],
  progress: { loaded: number; total: number },
  fromCache: boolean,
  lastUpdated: number | null,
  localeTitle: string | null,
): StatusInfo {
  const label = localeTitle ? `События ${localeTitle}` : "События";
  let resolved = 0;
  const cultureEvents = events.filter(
    (e) => (e.source ?? "culture") === "culture",
  );
  const total = cultureEvents.length;

  for (const e of cultureEvents) if (hasEventCoords(e._id)) resolved++;

  if (error) {
    return { percent: 0, statusText: `Ошибка: ${error}`, tone: "error" };
  }
  if (loading) {
    const pagePct = progress.total > 0 ? progress.loaded / progress.total : 0;
    // Пока грузится афиша — проценты по страницам, ограничены 30%
    return {
      percent: Math.max(1, Math.round(pagePct * 30)),
      statusText: `${label}, загрузка…`,
      tone: "progress",
    };
  }
  if (stopped) {
    const coordsPct = total > 0 ? resolved / total : 0;
    return {
      percent: Math.round(30 + coordsPct * 70),
      statusText: `${label}, остановлено`,
      tone: "stopped",
    };
  }
  if (total === 0) {
    return { percent: 100, statusText: `${label}, нет событий`, tone: "done" };
  }
  if (resolved < total) {
    const coordsPct = resolved / total;
    return {
      percent: Math.round(30 + coordsPct * 70),
      statusText: `${label}, загрузка…`,
      tone: "progress",
    };
  }
  // готово
  let text = `${label}, готово`;
  if (fromCache && lastUpdated) {
    text += ` · обновлено ${formatRelative(lastUpdated)}`;
  }
  return { percent: 100, statusText: text, tone: "done" };
}

function CircularProgress({
  percent,
  tone,
  size = 44,
}: {
  percent: number;
  tone: StatusInfo["tone"];
  size?: number;
}) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  const color =
    tone === "error"
      ? "#ef4444"
      : tone === "stopped"
        ? "#f59e0b"
        : tone === "done"
          ? "#22c55e"
          : "#3b82f6";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.3s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="600"
        fill="#1f2937"
      >
        {percent}%
      </text>
    </svg>
  );
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
  debug = false,
}: Props) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    const unsub = onCoordsUpdated(() => forceUpdate());
    return () => {
      unsub();
    };
  }, []);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggle = (next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const { percent, statusText, tone } = computeStatus(
    loading,
    stopped,
    error,
    events,
    progress,
    fromCache,
    lastUpdated,
    localeTitle,
  );

  // --- Автоскрытие после завершения ---
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (tone === "done") {
      const t = setTimeout(() => setHidden(true), HIDE_DELAY_MS);
      return () => clearTimeout(t);
    }
    // любой другой статус — показываем панель
    setHidden(false);
  }, [tone]);

  // --- Хоткеи для тестирования ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // игнорируем, если фокус в input/textarea
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === "u") {
        e.preventDefault();
        onRefresh();
      } else if (k === "s") {
        e.preventDefault();
        onStop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRefresh, onStop]);

  if (hidden) return null;

  // --- Свёрнутый вид: кружок ---
  if (collapsed) {
    return (
      <button
        onClick={() => toggle(false)}
        className="
          self-start
          bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-1.5
          hover:bg-gray-50 active:scale-95 transition
        "
        title={statusText}
        aria-label={`Развернуть панель прогресса. ${percent}%. ${statusText}`}
      >
        <CircularProgress percent={percent} tone={tone} />
      </button>
    );
  }

  // --- Развёрнутый вид: белая плашка ---
  return (
    <div
      className="
        relative w-full
        bg-white/95 backdrop-blur-sm shadow-lg rounded-lg
        px-4 py-2 pr-10 text-sm text-gray-800
      "
    >
      {/* Крестик в правом верхнем углу */}
      <button
        onClick={() => toggle(true)}
        className="
          absolute top-1.5 right-1.5
          w-7 h-7 flex items-center justify-center
          text-gray-400 hover:text-gray-700 hover:bg-gray-100
          rounded transition
        "
        title="Свернуть панель"
        aria-label="Свернуть панель"
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

      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span
              className={
                "text-sm leading-tight " +
                (tone === "error"
                  ? "text-red-600"
                  : tone === "stopped"
                    ? "text-amber-600"
                    : tone === "done"
                      ? "text-green-700"
                      : "text-gray-700")
              }
            >
              {statusText}
            </span>
            <span className="font-mono text-xs text-gray-500 tabular-nums shrink-0">
              {percent}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={
                "h-full transition-all duration-300 " +
                (tone === "error"
                  ? "bg-red-500"
                  : tone === "stopped"
                    ? "bg-amber-500"
                    : tone === "done"
                      ? "bg-green-500"
                      : "bg-blue-500")
              }
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {debug && (
          <>
            <button
              onClick={onRefresh}
              className="shrink-0 text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
              title="Обновить данные (U)"
            >
              Обновить
            </button>
            <button
              onClick={onStop}
              className="shrink-0 text-xs px-3 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
              title="Остановить (S)"
            >
              Стоп
            </button>
          </>
        )}
      </div>
    </div>
  );
}
