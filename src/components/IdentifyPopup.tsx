import { useReverseGeocode } from "../hooks/useReverseGeocode";
import WikipediaImage from "./WikipediaImage";

interface Props {
  lat: number;
  lng: number;
  onClose: () => void;
  onShowCityEvents?: () => void;
  showCityEventsLabel?: string;
}

export default function IdentifyPopup({
  lat,
  lng,
  onClose,
  onShowCityEvents,
  showCityEventsLabel = "Показать события этого города",
}: Props) {
  const { data, loading, error } = useReverseGeocode(lat, lng);

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

              {(data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.state) && (
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">Населённый пункт: </span>
                  {data.address.city ||
                    data.address.town ||
                    data.address.village}
                  {data.address.state && `, ${data.address.state}`}
                  {data.address.country && `, ${data.address.country}`}
                </div>
              )}

              {(data.address.road || data.address.houseNumber) && (
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">Улица: </span>
                  {[data.address.road, data.address.houseNumber]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}

              {data.address.postcode && (
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">Индекс: </span>
                  {data.address.postcode}
                </div>
              )}

              <div className="text-xs text-gray-500 font-mono">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <a
                  href={data.osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Открыть в OSM
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 9L9 3M9 3H5M9 3V7" />
                  </svg>
                </a>
              </div>

              {onShowCityEvents && (
                <button
                  onClick={onShowCityEvents}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2 transition"
                >
                  {showCityEventsLabel}
                </button>
              )}
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
