import { hasEventCoords, setEventCoords } from "./coordsCache";
import { fetchEventCoords } from "./culturePage";

type Listener = () => void;

const queues = new Map<string, Map<number, string>>(); // locale → (id → name)
const listeners = new Set<Listener>();

let activeLocale: string | null = null;
let running = false;
let stopped = false;

/** Пауза между запросами к culture.ru, мс. */
const PAGE_REQUEST_DELAY_MS = 300;

/**
 * Установить активную локаль. Очереди других локалей очищаются.
 */
export function setActiveLocale(locale: string | null): void {
  if (activeLocale === locale) return;
  console.log(`[queue] Смена активной локали: ${activeLocale} → ${locale}`);

  for (const key of Array.from(queues.keys())) {
    if (key !== locale) {
      const size = queues.get(key)?.size ?? 0;
      if (size > 0) {
        console.log(`[queue] Сбрасываю очередь для "${key}": ${size} задач`);
      }
      queues.delete(key);
    }
  }

  activeLocale = locale;
  stopped = false;
  notify();

  if (locale) void startWorker();
}

export function enqueueEventCoords(
  eventId: number,
  eventName: string,
  locale: string,
): void {
  if (hasEventCoords(eventId)) return;
  if (!locale) return;
  if (activeLocale && locale !== activeLocale) return;

  let q = queues.get(locale);
  if (!q) {
    q = new Map();
    queues.set(locale, q);
  }
  if (q.has(eventId)) return;
  q.set(eventId, eventName);
  notify();
  void startWorker();
}

export function onCoordsUpdated(cb: Listener): () => void {
  listeners.add(cb);
  try {
    cb();
  } catch (e) {
    console.warn("[queue] listener error:", e);
  }
  return () => {
    listeners.delete(cb);
  };
}

export function getQueueSize(): number {
  if (!activeLocale) return 0;
  return queues.get(activeLocale)?.size ?? 0;
}

export function stopQueue(): void {
  let total = 0;
  for (const q of queues.values()) total += q.size;
  console.log(`[queue] Остановка, снято задач: ${total}`);
  stopped = true;
  queues.clear();
  notify();
}

function notify(): void {
  for (const cb of listeners) cb();
}

async function startWorker(): Promise<void> {
  if (running) return;
  running = true;
  console.log("[queue] Старт обработки очереди");

  while (true) {
    if (stopped) {
      console.log("[queue] Остановлено пользователем");
      break;
    }

    const locale = activeLocale;
    if (!locale) break;

    const q = queues.get(locale);
    if (!q || q.size === 0) break;

    const [eventId, eventName] = q.entries().next().value as [number, string];
    if (eventId === undefined) break;
    q.delete(eventId);
    notify();

    console.log(`[queue] Беру #${eventId} ("${locale}", в очереди ${q.size})`);

    try {
      const coords = await fetchEventCoords(eventId, eventName);
      setEventCoords(eventId, coords);

      if (coords) {
        console.log(`[queue] #${eventId} OK → [${coords[0]}, ${coords[1]}]`);
      } else {
        console.warn(`[queue] #${eventId} — координаты не найдены`);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        console.log(`[queue] #${eventId} abort`);
        break;
      }
      console.warn(`[queue] #${eventId} ошибка:`, e);
      setEventCoords(eventId, null);
    }

    notify();

    if (activeLocale !== locale) {
      console.log("[queue] Локаль сменилась, прерываю текущий воркер");
      break;
    }

    await new Promise((r) => setTimeout(r, PAGE_REQUEST_DELAY_MS));
  }

  running = false;
  console.log("[queue] Воркер завершён");
}
