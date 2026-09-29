import type { Coords } from "./coordsCache";

/** Метры в градусы широты. 1° ≈ 111320 м. */
const METERS_PER_DEG_LAT = 111_320;

/** Долгота сжимается по мере удаления от экватора. */
function metersPerDegLng(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

/**
 * Смещает координаты случайно на 5–10 метров.
 * Гарантирует, что точка не окажется ближе 5 м или дальше 10 м от исходной.
 */
export function jitterCoords(coords: Coords): Coords {
  const [lng, lat] = coords;

  if (lng < 70 || lng > 100 || lat < 50 || lat > 60) {
    console.warn(`[jitter] Подозрительные координаты [${lng}, ${lat}]`);
    return coords;
  }

  const angle = Math.random() * Math.PI * 2;
  const distance = 10 + Math.random() * 5; // 10–15 м

  const dLatMeters = distance * Math.sin(angle);
  const dLngMeters = distance * Math.cos(angle);

  const dLat = dLatMeters / METERS_PER_DEG_LAT;
  const dLng = dLngMeters / metersPerDegLng(lat);

  return [lng + dLng, lat + dLat];
}
