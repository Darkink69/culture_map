const BASE = "/culture";

export async function fetchEventCoords(
  _buildId: string,
  eventId: number,
  _locale: string,
  signal?: AbortSignal,
): Promise<[number, number] | null> {
  // ВАЖНО: путь начинается с /culture, чтобы Vite-прокси отправил его на culture.ru.
  // Без префикса Vite вернёт index.html нашего приложения (618 байт).
  const url = `${BASE}/events/${eventId}`;
  console.log(`[page] GET ${url}`);

  let res: Response;
  try {
    res = await fetch(url, { signal, credentials: "omit" });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw e;
    console.warn(`[page] #${eventId} fetch error:`, e);
    return null;
  }

  console.log(`[page] #${eventId} HTTP ${res.status}`);

  if (!res.ok) return null;

  const html = await res.text();
  console.log(`[page] #${eventId} HTML size = ${html.length}`);

  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) {
    console.warn(`[page] #${eventId} __NEXT_DATA__ не найден в HTML`);
    console.warn(`[page] #${eventId} HTML head:`, html.slice(0, 300));
    return null;
  }

  console.log(
    `[page] #${eventId} __NEXT_DATA__ найден, длина JSON = ${match[1].length}`,
  );

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
