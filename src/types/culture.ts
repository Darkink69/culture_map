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
}

export interface CultureRecommendation {
  _id: number;
  title: string;
  name: string;
  places?: CulturePlace[];
}

export interface EventsPagination {
  total: number; // общее количество СТРАНИЦ
  current: number; // текущая страница
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
