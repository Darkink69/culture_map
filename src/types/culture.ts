export interface CultureTag {
  _id: number;
  name: string;
  title: string;
  isImportant: boolean;
}

export interface CultureThumbnailFile {
  _id: number;
  originalName: string;
  publicId: string;
  mimeType: string;
  width: number;
  height: number;
  meta?: {
    author?: string;
    source?: string;
  };
}

export interface CulturePlace {
  _id: string;
  title: string;
  address: string;
  eventId: number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
}

/** Источник события. */
export type EventSource = "culture" | "gde-chto" | "local";

export interface CultureEvent {
  _id: number;
  title: string;
  name: string;
  isPremiere: boolean;
  isPushkinsCard: boolean;
  price?: { min: number; max: number };
  seanceEndDate?: string;
  tags?: CultureTag[];
  genres?: { _id: number; name: string; title: string }[];
  thumbnailFile?: CultureThumbnailFile;
  places?: CulturePlace[];
  topPlaceTitle?: string;

  // --- Мультиисточниковые поля ---

  /** Источник события. Если не задан — "culture". */
  source?: EventSource;

  /** Прямая ссылка на картинку (для local и gde-chto). */
  imageUrl?: string;

  /** Ссылка на страницу события во внешнем источнике. */
  externalUrl?: string;

  /** Описание (для gde-chto и local). У culture — нет, там своя логика. */
  description?: string;

  /** Дата начала в ISO (для gde-chto). */
  dateFrom?: string;

  /** Дополнительные поля gde-chto, которые могут понадобиться в модалке. */
  gdeChto?: {
    place?: string;
    address?: string;
    site?: string;
    phone?: string;
    startTime?: string;
    endTime?: string;
    textDate?: string;
    textTime?: string;
    entranceFree?: boolean;
  };
}

export interface CultureRecommendation {
  _id: number;
  title: string;
  name: string;
  places?: CulturePlace[];
}

export interface EventsPagination {
  total: number;
  current: number;
}

export interface EventsPage {
  total: number;
  items: CultureEvent[];
  pagination: EventsPagination;
  recommendations?: CultureRecommendation[];
}

export interface EventsResponse {
  pageProps: {
    events: EventsPage;
  };
}
