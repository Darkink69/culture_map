import { useEffect, useState } from "react";
import { useReverseGeocode } from "../hooks/useReverseGeocode";
import WikipediaImage from "./WikipediaImage";

interface Props {
  lat: number;
  lng: number;
  onClose: () => void;
  /**
   * Если передано — покажем кнопку «Показать события этого города» (красная).
   * Если не передано — считаем, что локаль совпадает, покажем «Закрыть» (синяя).
   */
  onShowCityEvents?: () => void;
  /**
   * Явный признак «локаль клика совпадает с текущей».
   * Если не передан — выводится из наличия onShowCityEvents.
   */
  isSameLocale?: boolean;
}

export default function IdentifyPopup({
  lat,
  lng,
  onClose,
  onShowCityEvents,
  isSameLocale,
}: Props) {
  const { data, loading, error } = useReverseGeocode(lat, lng);
  const [copied, setCopied] = useState(false);

  // Сбрасываем «Скопировано» при смене точки
  useEffect(() => {
    setCopied(false);
  }, [lat, lng]);

  const sameLocale = isSameLocale ?? !onShowCityEvents;

  const coordsText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coordsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.warn("[identify] Не удалось скопировать:", e);
      // Фолбэк для не-secure context (http:// на VPS)
      try {
        const ta = document.createElement("textarea");
        ta.value = coordsText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (e2) {
        console.error("[identify] Копирование не удалось:", e2);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <WikipediaImage lat={lat} lng={lng} alt="Место на карте" />

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 leading-snug">
              {loading && !data
                ? "Определяем адрес…"
                : (data?.shortName ?? "Место")}
            </h2>
            <button
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-gray-700 text-2xl leading-none -mt-1"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          {data && (
            <>
              <div className="text-sm text-gray-700">
                <span className="text-gray-500">Адрес: </span>
                <span className="font-medium">{data.displayName}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <span>
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 active:scale-95 transition text-gray-500 hover:text-gray-800"
                  title={copied ? "Скопировано" : "Скопировать координаты"}
                  aria-label="Скопировать координаты"
                >
                  {copied ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="pt-1">
                {sameLocale ? (
                  <button
                    onClick={onClose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2 transition"
                  >
                    Закрыть
                  </button>
                ) : (
                  onShowCityEvents && (
                    <button
                      onClick={onShowCityEvents}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg py-2 transition"
                    >
                      Показать события этого города
                    </button>
                  )
                )}
              </div>
            </>
          )}

          {loading && !data && (
            <div className="text-xs text-gray-400">Запрос к Nominatim…</div>
          )}
        </div>
      </div>
    </div>
  );
}
