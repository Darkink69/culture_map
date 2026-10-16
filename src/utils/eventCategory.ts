export type EventCategory =
  | "spektakli"
  | "kontserti"
  | "vstrechi"
  | "obuchenie"
  | "vystavki"
  | "other";

export interface CategoryConfig {
  color: string;
  label: string;
  /** Путь к SVG-иконке в /public/icons */
  icon: string;
}

export const CATEGORY_CONFIG: Record<EventCategory, CategoryConfig> = {
  spektakli: {
    color: "#8b3a3a",
    label: "Театр",
    icon: "/icons/theater.svg",
  },
  kontserti: {
    color: "#2f4a6d",
    label: "Музыка",
    icon: "/icons/music.svg",
  },
  vstrechi: {
    color: "#4a6d3a",
    label: "Встречи",
    icon: "/icons/meetings.svg",
  },
  obuchenie: {
    color: "#a6893a",
    label: "Обучение",
    icon: "/icons/education.svg",
  },
  vystavki: {
    color: "#6d4a6d",
    label: "Выставки",
    icon: "/icons/pictures.svg",
  },
  other: {
    color: "#6d6d6d",
    label: "Другое",
    icon: "/icons/other.svg",
  },
};

const GDE_CHTO_MAP: Record<string, EventCategory> = {
  "Спектакль (театр, сценическое искусство, постановка)": "spektakli",
  "Музыка (концерты, фестивали)  ": "kontserti",
  "Музыка (концерты, фестивали)": "kontserti",
  Выставка: "vystavki",
  "Наука и образование (конференции, семинары, симпозиумы, школы, курсы)":
    "obuchenie",
  "Развитие (тренинги, курсы, лекции, дискуссии, книжные клубы, психология)":
    "obuchenie",
  "Творчество (мастер-класс, обучение)": "obuchenie",
  "Бизнес и технологии (конференции, нетворкинг, форумы)": "obuchenie",
  "Экскурсия (экскурсии, прогулки)": "vstrechi",
  Вечеринка: "vstrechi",
  "Праздник (фестивали, массовые мероприятия)": "vstrechi",
  "Игра (квесты, квизы, викторины, настолки)": "vstrechi",
  "Шоу (стендап, открытый микрофон, литературные чтения, шоу, перформанс)":
    "spektakli",
};

export function getEventCategory(event: {
  genres?: { name: string; title?: string }[];
  source?: string;
}): EventCategory {
  const g = event.genres?.[0];
  if (!g) return "other";

  if (event.source === "gde-chto") {
    const mapped = GDE_CHTO_MAP[g.title ?? ""];
    if (mapped) return mapped;
    return "other";
  }

  if (g.name && g.name in CATEGORY_CONFIG) return g.name as EventCategory;
  return "other";
}
