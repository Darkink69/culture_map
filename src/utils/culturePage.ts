const BASE = "/culture";

/**
 * Загружает HTML страницы события и извлекает координаты из __NEXT_DATA__.
 *
 * ВАЖНО: culture.ru на /events/{id} отвечает 308 → /events/{id}/{slug}.
 * Nginx-прокси переписывает Location обратно на /culture/...,
 * поэтому fetch с redirect: "follow" спокойно идёт по цепочке,
 * оставаясь на нашем origin.
 */
export async function fetchEventCoords(
  eventId: number,
  eventName: string,
  signal?: AbortSignal,
): Promise<[number, number] | null> {
  const url = `${BASE}/events/${eventId}/${eventName}`;
  console.log(`[page] GET ${url}`);

  let res: Response;
  try {
    res = await fetch(url, {
      signal,
      credentials: "omit",
      redirect: "follow",
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw e;
    console.warn(`[page] #${eventId} fetch error:`, e);
    return null;
  }

  console.log(`[page] #${eventId} HTTP ${res.status} (final url: ${res.url})`);

  if (!res.ok) return null;

  const html = await res.text();
  console.log(`[page] #${eventId} HTML size = ${html.length}`);

  // Защита: если прокси не сработал, придёт наш index.html (~600 б)
  if (html.length < 5000) {
    console.warn(
      `[page] #${eventId} HTML слишком маленький (${html.length} б) — ` +
        `прокси не сработал или редирект ушёл мимо`,
    );
    console.warn(`[page] #${eventId} head:`, html.slice(0, 200));
    return null;
  }

  // Признак HTML culture.ru
  if (!html.includes("__NEXT_DATA__")) {
    console.warn(`[page] #${eventId} нет __NEXT_DATA__ — не тот HTML`);
    console.warn(`[page] #${eventId} head:`, html.slice(0, 300));
    return null;
  }

  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) {
    console.warn(`[page] #${eventId} __NEXT_DATA__ не распарсился`);
    return null;
  }

  let json: unknown;
  try {
    json = JSON.parse(match[1]);
  } catch (e) {
    console.warn(`[page] #${eventId} JSON.parse failed:`, e);
    return null;
  }

  const coords = findCoords(json);
  if (coords) {
    console.log(`[page] #${eventId} coords = [${coords[0]}, ${coords[1]}]`);
  } else {
    console.warn(`[page] #${eventId} координаты не найдены в JSON`);
  }
  return coords;
}

/**
 * Рекурсивно ищет первый объект вида
 * { location: { type: "Point", coordinates: [lng, lat] } }
 * или { type: "Point", coordinates: [lng, lat] }.
 */
function findCoords(node: unknown, depth = 0): [number, number] | null {
  if (!node || typeof node !== "object" || depth > 12) return null;

  const n = node as Record<string, unknown>;

  const loc = n.location as
    | { type?: string; coordinates?: unknown }
    | undefined;
  if (
    loc &&
    loc.type === "Point" &&
    Array.isArray(loc.coordinates) &&
    loc.coordinates.length === 2 &&
    typeof loc.coordinates[0] === "number" &&
    typeof loc.coordinates[1] === "number"
  ) {
    return [loc.coordinates[0], loc.coordinates[1]];
  }

  if (
    n.type === "Point" &&
    Array.isArray(n.coordinates) &&
    n.coordinates.length === 2 &&
    typeof n.coordinates[0] === "number" &&
    typeof n.coordinates[1] === "number"
  ) {
    return [n.coordinates[0], n.coordinates[1]];
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findCoords(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  for (const key of Object.keys(n)) {
    const found = findCoords(n[key], depth + 1);
    if (found) return found;
  }
  return null;
}
