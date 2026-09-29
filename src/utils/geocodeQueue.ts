import { hasEventCoords, setEventCoords } from "./coordsCache";
import { fetchEventCoords } from "./culturePage";

type Listener = () => void;

interface QueueItem {
  eventId: number;
  buildId: string;
  locale: string;
}

const queue = new Map<number, QueueItem>();
const listeners = new Set<Listener>();
let running = false;

const PAGE_REQUEST_DELAY_MS = 300;

export function enqueueEventCoords(
  eventId: number,
  buildId: string,
  locale: string,
): void {
  if (hasEventCoords(eventId)) return;
  if (queue.has(eventId)) return;
  queue.set(eventId, { eventId, buildId, locale });
  notify();
  void startWorker();
}

export function onCoordsUpdated(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getQueueSize(): number {
  return queue.size;
}

function notify(): void {
  for (const cb of listeners) cb();
}

async function startWorker(): Promise<void> {
  if (running) return;
  running = true;
  console.log("[queue] Старт обработки очереди");

  while (queue.size > 0) {
    if (stopped) {
      console.log("[queue] Остановлено пользователем");
      break;
    }
    const next = queue.entries().next().value;
    if (!next) break;
    const [eventId, item] = next as [number, QueueItem];
    queue.delete(eventId);
    notify();

    console.log(
      `[queue] Беру #${item.eventId} (осталось в очереди: ${queue.size})`,
    );

    try {
      const coords = await fetchEventCoords(
        item.buildId,
        item.eventId,
        item.locale,
      );
      setEventCoords(item.eventId, coords);

      if (coords) {
        console.log(
          `[queue] #${item.eventId} OK → [${coords[0]}, ${coords[1]}]`,
        );
      } else {
        console.warn(`[queue] #${item.eventId} — координаты не найдены`);
      }
    } catch (e) {
      console.warn(`[queue] #${item.eventId} ошибка:`, e);
      setEventCoords(item.eventId, null);
    }

    notify();
    await new Promise((r) => setTimeout(r, PAGE_REQUEST_DELAY_MS));
  }

  running = false;
  console.log("[queue] Очередь пуста");
}

let stopped = false;

export function stopQueue(): void {
  console.log("[queue] Остановка очереди");
  stopped = true;
  queue.clear();
  notify();
}

export function resumeQueue(): void {
  stopped = false;
}
