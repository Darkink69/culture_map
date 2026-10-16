import { useEffect, useState } from "react";
import type { CultureEvent } from "../types/culture";
import { fetchGdeChtoImage } from "../utils/gdeChtoSource";
import { CATEGORY_CONFIG, getEventCategory } from "../utils/eventCategory";

interface Props {
  event: CultureEvent | null;
  onClose: () => void;
}

function useEventImage(event: CultureEvent | null): string | null {
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    if (!event) {
      setImg(null);
      return;
    }
    const source = event.source ?? "culture";

    if (source === "culture") {
      setImg(
        event.thumbnailFile
          ? `https://cdn.culture.ru/images/${event.thumbnailFile.publicId}`
          : null,
      );
      return;
    }

    if (source === "local") {
      setImg(event.imageUrl || null);
      return;
    }

    if (source === "gde-chto") {
      setImg(null);
      const oid = -event._id - 1_000_000;
      if (!isFinite(oid) || oid <= 0) return;
      let cancelled = false;
      fetchGdeChtoImage(oid).then((url) => {
        if (!cancelled) setImg(url);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [event]);

  return img;
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

function ExternalIcon() {
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
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function EventModal({ event, onClose }: Props) {
  const imgUrl = useEventImage(event);

  if (!event) return null;

  const source = event.source ?? "culture";
  const place = event.places?.[0];
  const price = event.price;
  const category = getEventCategory(event);
  const catCfg = CATEGORY_CONFIG[category];

  let detailsUrl: string | null = null;
  if (source === "culture") {
    detailsUrl = `https://www.culture.ru/events/${event._id}`;
  } else if (source === "gde-chto") {
    detailsUrl = event.externalUrl ?? null;
  }

  const dateToShow = event.seanceEndDate
    ? new Date(event.seanceEndDate).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

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
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={catCfg.icon}
              alt=""
              className="w-8 h-8 shrink-0"
              title={catCfg.label}
            />
            <div className="min-w-0">
              <div className="razer text-[10px] tracking-widest uppercase text-gray-500">
                {catCfg.label}
              </div>
              <h2 className="razerBold text-lg text-[#3a3226] leading-tight">
                {event.title}
              </h2>
            </div>
          </div>
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
          {imgUrl && (
            <div className="w-full aspect-16/10 bg-white rounded-2xl overflow-hidden">
              <img
                src={imgUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {place && (
            <div>
              <div className="razer text-[10px] tracking-widest uppercase text-gray-500 mb-1">
                Место
              </div>
              <div className="razer text-sm text-[#3a3226]">
                <span className="font-medium">{place.title}</span>
                {place.address && (
                  <div className="text-gray-500 text-xs mt-0.5">
                    {place.address}
                  </div>
                )}
              </div>
            </div>
          )}

          {dateToShow && (
            <div>
              <div className="razer text-[10px] tracking-widest uppercase text-gray-500 mb-1">
                Ближайшая дата
              </div>
              <div className="razer text-sm text-[#3a3226]">{dateToShow}</div>
            </div>
          )}

          {price && (
            <div>
              <div className="razer text-[10px] tracking-widest uppercase text-gray-500 mb-1">
                Цена
              </div>
              <div className="razer text-sm text-[#3a3226]">
                {price.min === price.max
                  ? `${price.min} ₽`
                  : `${price.min} – ${price.max} ₽`}
              </div>
            </div>
          )}

          {event.description && (
            <div>
              <div className="razer text-[10px] tracking-widest uppercase text-gray-500 mb-1">
                Описание
              </div>
              <div className="razer text-sm text-[#3a3226] whitespace-pre-line leading-relaxed">
                {event.description}
              </div>
            </div>
          )}

          {event.isPushkinsCard && (
            <div className="razer text-xs bg-[#e8ddc8] text-[#6b5a3e] px-3 py-1.5 rounded-full inline-block">
              Пушкинская карта
            </div>
          )}
        </div>

        {detailsUrl && (
          <div className="px-5 pb-5 pt-3 border-t border-[#e8e0d2]">
            <a
              href={detailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="razer inline-flex items-center gap-1.5 text-sm text-[#8b7355] hover:text-[#3a3226] transition"
            >
              Подробнее
              <ExternalIcon />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
