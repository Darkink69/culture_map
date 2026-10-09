export type SourceId = "local" | "gde-chto" | "culture";

export interface SourceConfig {
  id: SourceId;
  enabled: boolean;
  /**
   * Локали, для которых актуален источник.
   * null = все локали.
   */
  locales: string[] | null;
  /** Кэшировать события источника. */
  cacheEvents: boolean;
  /** Кэшировать координаты источника. */
  cacheCoords: boolean;
  /** Учитывать в прогресс-панели. */
  countInProgress: boolean;
}

/**
 * Порядок в массиве = порядок загрузки.
 * Сначала «свои» точки (мгновенно), потом gde-chto (один запрос),
 * потом culture.ru (много запросов, долго).
 */
export const SOURCES: SourceConfig[] = [
  {
    id: "local",
    enabled: true,
    locales: null,
    cacheEvents: false,
    cacheCoords: false,
    countInProgress: false,
  },
  {
    id: "gde-chto",
    enabled: true,
    locales: null, // пока всегда — упрощение
    cacheEvents: false,
    cacheCoords: false,
    countInProgress: false,
  },
  {
    id: "culture",
    enabled: true,
    locales: null,
    cacheEvents: true,
    cacheCoords: true,
    countInProgress: true,
  },
];
