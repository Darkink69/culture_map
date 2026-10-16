import { useEffect, useState } from "react";
import { useReverseGeocode } from "../hooks/useReverseGeocode";
import WikipediaImage from "./WikipediaImage";

interface Props {
  lat: number;
  lng: number;
  onClose: () => void;
  onShowCityEvents?: () => void;
  isSameLocale?: boolean;
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function CopyIcon() {
  return (
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
  );
}

function CheckIcon() {
  return (
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
  );
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
    } catch {
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

  const title =
    loading && !data ? "Определяем адрес…" : (data?.shortName ?? "Место");

  return (
    <div
      className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#f5f1ea] rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="razerBold text-lg text-[#3a3226] leading-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-500 hover:text-gray-800 p-1 -mt-1"
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Скроллируемое содержимое */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">
          <WikipediaImage lat={lat} lng={lng} alt="Место на карте" />

          {error && (
            <div className="razer text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
              {error}
            </div>
          )}

          {data && (
            <>
              <div>
                <div className="razer text-[10px] tracking-widest uppercase text-gray-500 mb-1">
                  Адрес
                </div>
                <div className="razer text-sm text-[#3a3226] leading-relaxed">
                  {data.displayName}
                </div>
              </div>

              <div>
                <div className="razer text-[10px] tracking-widest uppercase text-gray-500 mb-1">
                  Координаты
                </div>
                <div className="flex items-center gap-2 razer text-sm text-[#3a3226] font-mono">
                  <span>{coordsText}</span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-[#e8ddc8] active:scale-95 transition text-gray-500 hover:text-[#3a3226]"
                    title={copied ? "Скопировано" : "Скопировать координаты"}
                    aria-label="Скопировать координаты"
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              </div>
            </>
          )}

          {loading && !data && (
            <div className="razer text-xs text-gray-400">
              Запрос к Nominatim…
            </div>
          )}
        </div>

        {/* Кнопка */}
        {data && (
          <div className="px-5 pb-5 pt-3 border-t border-[#e8e0d2]">
            {sameLocale ? (
              <button
                onClick={onClose}
                className="razerBold w-full bg-[#7a8ba3] hover:bg-[#6b7c94] text-white text-sm rounded-2xl py-3 transition shadow-sm"
              >
                Закрыть
              </button>
            ) : (
              onShowCityEvents && (
                <button
                  onClick={onShowCityEvents}
                  className="razerBold w-full bg-[#a35a5a] hover:bg-[#8f4a4a] text-white text-sm rounded-2xl py-3 transition shadow-sm"
                >
                  Показать события этого города
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
