import type { CultureEvent } from "../types/culture";

interface Props {
  event: CultureEvent | null;
  onClose: () => void;
}

export default function EventModal({ event, onClose }: Props) {
  if (!event) return null;

  const thumb = event.thumbnailFile;
  const imgUrl = thumb
    ? `https://cdn.culture.ru/images/${thumb.publicId}`
    : null;
  const place = event.places?.[0];
  const price = event.price;
  const detailsUrl = `https://www.culture.ru/events/${event._id}`;

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
            <h2 className="text-lg font-semibold text-gray-900 leading-snug razerBold">
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
              <span className="text-gray-500 razer">Место: </span>
              <span className="font-medium">{place.title}</span>
              {place.address && (
                <div className="text-gray-500 mt-0.5 razer">
                  {place.address}
                </div>
              )}
            </div>
          )}

          {event.seanceEndDate && (
            <div className="text-sm text-gray-700 razer">
              <span className="text-gray-500">Ближайшая дата: </span>
              {new Date(event.seanceEndDate).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          {price && (
            <div className="text-sm text-gray-700 razer">
              <span className="text-gray-500">Цена: </span>
              {price.min === price.max
                ? `${price.min} ₽`
                : `${price.min} – ${price.max} ₽`}
            </div>
          )}

          {event.isPushkinsCard && (
            <div className="inline-block text-xs razer bg-purple-100 text-purple-700 px-2 py-1 rounded">
              Пушкинская карта
            </div>
          )}

          <div className="pt-2 razer">
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
        </div>
      </div>
    </div>
  );
}
