import type { CultureEvent } from "../types/culture";

/**
 * Минимальный набор для рендера:
 * - _id — ключ маркера и открытия модалки
 * - title, name — заголовок и слаг
 * - isPremiere, isPushkinsCard — бейджи
 * - price — цена
 * - seanceEndDate — фильтр «активно»
 * - genres[0].name — категория маркера (getEventCategory)
 * - thumbnailFile.publicId — картинка в модалке
 * - topPlaceTitle — название места в модалке
 *
 * НЕ сохраняем:
 * - places (координаты всё равно null, а объём огромный)
 * - tags, microdata, cardSchedule, selectedLocalePlace, nearestSeancePlace,
 *   renderId, urlEventId, eipskEventId, placesCount, ageRestriction,
 *   hasBenefits, isAccessible, permanent, pushkinSchedule, date
 */
export function compactEvent(e: CultureEvent): CultureEvent {
  return {
    _id: e._id,
    title: e.title,
    name: e.name,
    isPremiere: e.isPremiere,
    isPushkinsCard: e.isPushkinsCard,
    price: e.price,
    seanceEndDate: e.seanceEndDate,
    // только первый жанр — этого достаточно для getEventCategory
    genres: e.genres?.[0]
      ? [
          {
            _id: e.genres[0]._id,
            name: e.genres[0].name,
            title: e.genres[0].title,
          },
        ]
      : undefined,
    thumbnailFile: e.thumbnailFile
      ? {
          _id: e.thumbnailFile._id,
          originalName: e.thumbnailFile.originalName,
          publicId: e.thumbnailFile.publicId,
          mimeType: e.thumbnailFile.mimeType,
          width: e.thumbnailFile.width,
          height: e.thumbnailFile.height,
        }
      : undefined,
    topPlaceTitle: e.topPlaceTitle,
  } as CultureEvent;
}

export function compactEvents(events: CultureEvent[]): CultureEvent[] {
  return events.map(compactEvent);
}
