// import type { EventsPage } from "../types/culture";
// import { getCoords, setCoordsBatch, type Coords } from "./coordsCache";

// /**
//  * Собирает координаты из блока recommendations страницы
//  * и возвращает список новых (id, coords), которых не было в кэше.
//  */
// export function harvestRecommendationCoords(page: EventsPage): number {
//   const recs = page.recommendations ?? [];
//   const toWrite: Array<[string, Coords]> = [];

//   for (const rec of recs) {
//     for (const place of rec.places ?? []) {
//       const loc = place.location;
//       if (!loc?.coordinates) continue;
//       if (getCoords(place._id)) continue; // уже есть

//       const [lng, lat] = loc.coordinates;
//       if (typeof lng !== "number" || typeof lat !== "number") continue;

//       toWrite.push([place._id, [lng, lat]]);
//     }
//   }

//   if (toWrite.length > 0) setCoordsBatch(toWrite);
//   return toWrite.length;
// }
