import type { CultureEvent, CulturePlace } from "../types/culture";

/**
 * Оставляем только то, что реально используется:
 * - EventMarkers: _id, genres (для getEventCategory)
 * - EventModal: title, price, seanceEndDate, topPlaceTitle, thumbnailFile,
 *   genres, isPushkinsCard, isPremiere
 * - filterActiveEvents: seanceEndDate
 * Всё остальное (microdata, cardSchedule, nearestSeancePlace, selectedLocalePlace,
 * renderId, urlEventId, eipskEventId, placesCount, ageRestriction, hasBenefits,
 * isAccessible, permanent, pushkinSchedule, date, tags) — вырезаем.
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
    genres: e.genres?.map((g) => ({
      _id: g._id,
      name: g.name,
      title: g.title,
    })),
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
    places: e.places?.map(compactPlace),
  } as CultureEvent;
}

function compactPlace(p: CulturePlace): CulturePlace {
  return {
    _id: p._id,
    title: p.title,
    address: p.address,
    eventId: p.eventId,
    location: p.location,
  };
}

export function compactEvents(events: CultureEvent[]): CultureEvent[] {
  return events.map(compactEvent);
}
