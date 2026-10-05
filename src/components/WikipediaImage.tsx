import { useEffect, useState } from "react";

interface Props {
  lat: number;
  lng: number;
  /** Радиус поиска в метрах, по умолчанию 500 */
  radius?: number;
  alt: string;
  className?: string;
}

interface WikiResult {
  title: string;
  extract?: string;
  imageUrl: string | null;
  pageUrl: string;
}

const WIKI_API = "https://ru.wikipedia.org/w/api.php";
const cache = new Map<string, WikiResult | null>();

function key(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export default function WikipediaImage({
  lat,
  lng,
  radius = 500,
  alt,
  className,
}: Props) {
  const [data, setData] = useState<WikiResult | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const k = key(lat, lng);
    if (cache.has(k)) {
      setData(cache.get(k) ?? null);
      return;
    }
    setLoading(true);

    (async () => {
      try {
        // 1. Ближайшие статьи
        const geoUrl = new URL(WIKI_API);
        geoUrl.searchParams.set("action", "query");
        geoUrl.searchParams.set("list", "geosearch");
        geoUrl.searchParams.set("gscoord", `${lat}|${lng}`);
        geoUrl.searchParams.set("gsradius", String(radius));
        geoUrl.searchParams.set("gslimit", "5");
        geoUrl.searchParams.set("format", "json");
        geoUrl.searchParams.set("origin", "*");

        const geoRes = await fetch(geoUrl.toString());
        const geoJson = await geoRes.json();
        const hits = geoJson?.query?.geosearch as
          | { pageid: number; title: string }[]
          | undefined;

        if (!hits || hits.length === 0) {
          cache.set(k, null);
          if (!cancelled) setData(null);
          return;
        }

        // 2. Берём первую статью и её картинку + экстракт
        const pageIds = hits
          .slice(0, 3)
          .map((h) => h.pageid)
          .join("|");
        const infoUrl = new URL(WIKI_API);
        infoUrl.searchParams.set("action", "query");
        infoUrl.searchParams.set("pageids", pageIds);
        infoUrl.searchParams.set("prop", "pageimages|extracts|info");
        infoUrl.searchParams.set("piprop", "thumbnail|original");
        infoUrl.searchParams.set("pithumbsize", "800");
        infoUrl.searchParams.set("exintro", "1");
        infoUrl.searchParams.set("explaintext", "1");
        infoUrl.searchParams.set("inprop", "url");
        infoUrl.searchParams.set("format", "json");
        infoUrl.searchParams.set("origin", "*");

        const infoRes = await fetch(infoUrl.toString());
        const infoJson = await infoRes.json();
        const pages = infoJson?.query?.pages as
          | Record<
              string,
              {
                title: string;
                extract?: string;
                thumbnail?: { source: string };
                original?: { source: string };
                fullurl?: string;
              }
            >
          | undefined;

        if (!pages) {
          cache.set(k, null);
          if (!cancelled) setData(null);
          return;
        }

        // Первая статья с картинкой
        const first = Object.values(pages).find(
          (p) => p.thumbnail?.source || p.original?.source,
        );
        const anyPage = first ?? Object.values(pages)[0];

        if (!anyPage) {
          cache.set(k, null);
          if (!cancelled) setData(null);
          return;
        }

        const result: WikiResult = {
          title: anyPage.title,
          extract: anyPage.extract,
          imageUrl:
            anyPage.original?.source ?? anyPage.thumbnail?.source ?? null,
          pageUrl:
            anyPage.fullurl ??
            `https://ru.wikipedia.org/?curid=${anyPage.title}`,
        };

        cache.set(k, result);
        if (!cancelled) setData(result);
      } catch (e) {
        console.warn("[wiki] ошибка:", e);
        cache.set(k, null);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lat, lng, radius]);

  if (loading || data === undefined) {
    return (
      <div
        className={`w-full aspect-16/10 bg-gray-100 animate-pulse ${className ?? ""}`}
      />
    );
  }

  if (!data?.imageUrl) return null;

  return (
    <a
      href={data.pageUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block w-full aspect-16/10 bg-gray-100 overflow-hidden ${className ?? ""}`}
    >
      <img
        src={data.imageUrl}
        alt={alt || data.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </a>
  );
}
