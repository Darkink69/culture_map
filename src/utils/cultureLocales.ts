const BASE = "/culture";

export interface LocaleItem {
  sysName: string;
  title: string;
  name: string;
}

interface ApiResponse {
  locales?: LocaleItem[];
  data?: LocaleItem[];
  items?: LocaleItem[];
}

/**
 * Ищет локали в culture.ru по строке запроса.
 * Возвращает массив найденных локалей (обычно 1 элемент).
 */
export async function findLocales(query: string): Promise<LocaleItem[]> {
  const url = new URL(
    `${BASE}/api-next/catalogFilters/afisha/locales`,
    window.location.origin,
  );
  url.searchParams.set("cached", "false");
  url.searchParams.set("query", query);

  try {
    const res = await fetch(url.toString(), { credentials: "omit" });
    if (!res.ok) {
      console.warn("[locales] HTTP", res.status);
      return [];
    }
    const json: ApiResponse = await res.json();
    const list = json.locales ?? json.data ?? json.items ?? [];
    console.log(`[locales] query="${query}" →`, list);
    return list;
  } catch (e) {
    console.warn("[locales] ошибка:", e);
    return [];
  }
}
