import { useEffect, useState } from "react";
import type { CultureEvent } from "../types/culture";
import { fetchGdeChtoImage } from "../utils/gdeChtoSource";

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
      // oid = -(_id + 1_000_000)
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

export default function EventModal({ event, onClose }: Props) {
  const imgUrl = useEventImage(event);

  if (!event) return null;

  const source = event.source ?? "culture";
  const place = event.places?.[0];
  const price = event.price;

  let detailsUrl: string | null = null;
  if (source === "culture") {
    detailsUrl = `https://www.culture.ru/events/${event._id}`;
  } else if (source === "gde-chto") {
    detailsUrl = event.externalUrl ?? null;
  }

  return (
    <div
      className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {imgUrl && (
          <div className="w-full aspect-16/10 bg-gray-100 overflow-hidden">
            <img
              src={imgUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 leading-snug">
              {event.title}
            </h2>
            <button
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-gray-700 text-2xl leading-none -mt-1"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          {place && (
            <div className="text-sm text-gray-700">
              <span className="text-gray-500">Место: </span>
              <span className="font-medium">{place.title}</span>
              {place.address && (
                <div className="text-gray-500 mt-0.5">{place.address}</div>
              )}
            </div>
          )}

          {event.seanceEndDate && (
            <div className="text-sm text-gray-700">
              <span className="text-gray-500">Ближайшая дата: </span>
              {new Date(event.seanceEndDate).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          {event.description && (
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {event.description}
            </div>
          )}

          {price && (
            <div className="text-sm text-gray-700">
              <span className="text-gray-500">Цена: </span>
              {price.min === price.max
                ? `${price.min} ₽`
                : `${price.min} – ${price.max} ₽`}
            </div>
          )}

          {event.isPushkinsCard && (
            <div className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              Пушкинская карта
            </div>
          )}

          {detailsUrl && (
            <div className="pt-2">
              <a
                href={detailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Подробнее
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
          )}
        </div>
      </div>
    </div>
  );
}
