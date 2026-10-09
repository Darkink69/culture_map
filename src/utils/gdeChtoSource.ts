import type { CultureEvent } from "../types/culture";

const BASE =
  "https://gde-chto.ru/elitegis/rest/services/novosibirsk/sights/MapServer/102/query";

interface GdeChtoAttributes {
  oid: number;
  name?: string;
  type?: number;
  type_for_search?: string;
  description?: string;
  address?: string;
  place?: string;
  site?: string;
  phone?: string;
  starttime?: string;
  endtime?: string;
  text_date?: string;
  text_time?: string;
  entrance?: number;
  date_from?: number;
  date_to?: number;
  /** ВНИМАНИЕ: в API поля перепутаны — geom_lat содержит ДОЛГОТУ. */
  geom_lat?: string;
  /** ВНИМАНИЕ: geom_long содержит ШИРОТУ. */
  geom_long?: string;
  [key: string]: unknown;
}

interface GdeChtoFeature {
  attributes: GdeChtoAttributes;
}

interface GdeChtoResponse {
  features?: GdeChtoFeature[];
  error?: unknown;
}

/**
 * Загружает события с gde-chto.ru.
 * Возвращает CultureEvent[] с source: "gde-chto".
 * Координаты берутся из attributes.geom_lat / geom_long (с учётом перепутанности).
 */
export async function fetchGdeChtoEvents(
  signal?: AbortSignal,
): Promise<CultureEvent[]> {
  const url = new URL(BASE);
  url.searchParams.set("f", "json");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("where", "1=1");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`gde-chto HTTP ${res.status}`);

  const json: GdeChtoResponse = await res.json();
  if (json.error) {
    throw new Error(`gde-chto error: ${JSON.stringify(json.error)}`);
  }

  const features = json.features ?? [];
  const result: CultureEvent[] = [];

  for (const f of features) {
    const a = f.attributes;

    // ⚠️ Поля перепутаны: geom_lat = долгота, geom_long = широта
    const lng = Number(a.geom_lat);
    const lat = Number(a.geom_long);

    if (!isFinite(lat) || !isFinite(lng) || lat === 0 || lng === 0) {
      continue;
    }

    // Отрицательные id в диапазоне, отдельном от local
    const id = -1_000_000 - Number(a.oid);

    const title = a.name?.trim() || "Без названия";
    const typeForSearch = a.type_for_search ?? "";
    const description = a.description ?? "";

    const event: CultureEvent = {
      _id: id,
      title,
      name: `gde-chto-${a.oid}`,
      isPremiere: false,
      isPushkinsCard: false,
      source: "gde-chto",
      description,
      topPlaceTitle: a.place ?? a.address ?? "",
      externalUrl: a.site ?? undefined,
      imageUrl: undefined, // картинка подгружается отдельно в модалке
      // В genres[0].title кладём type_for_search — по нему маппится категория
      genres: typeForSearch
        ? [{ _id: 0, name: "other", title: typeForSearch }]
        : undefined,
      seanceEndDate: a.date_to ? new Date(a.date_to).toISOString() : undefined,
      dateFrom: a.date_from ? new Date(a.date_from).toISOString() : undefined,
      gdeChto: {
        place: a.place ?? undefined,
        address: a.address ?? undefined,
        site: a.site ?? undefined,
        phone: a.phone ?? undefined,
        startTime: a.starttime ?? undefined,
        endTime: a.endtime ?? undefined,
        textDate: a.text_date ?? undefined,
        textTime: a.text_time ?? undefined,
        entranceFree: a.entrance === 0,
      },
      places: [
        {
          _id: `gde-${a.oid}`,
          title: a.place ?? title,
          address: a.address ?? "",
          eventId: id,
          location: { type: "Point", coordinates: [lng, lat] },
        },
      ],
    };

    result.push(event);
  }

  return result;
}

/**
 * Загружает ссылку на картинку события gde-chto.
 * Берём второе вложение (первое обычно превью), если есть.
 */
export async function fetchGdeChtoImage(
  oid: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = `https://gde-chto.ru/elitegis/rest/services/novosibirsk/sights/MapServer/102/${oid}/attachments/?f=json`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      attachmentInfos?: { id: number; contentType: string }[];
      error?: unknown;
    };
    if (data.error || !data.attachmentInfos?.length) return null;

    const infos = data.attachmentInfos.filter((a) =>
      a.contentType.startsWith("image/"),
    );
    if (infos.length === 0) return null;

    const chosen = infos.length > 1 ? infos[1] : infos[0];
    return `https://gde-chto.ru/elitegis/rest/services/novosibirsk/sights/MapServer/102/${oid}/attachments/${chosen.id}`;
  } catch {
    return null;
  }
}
