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
  emoji: string;
}

export const CATEGORY_CONFIG: Record<EventCategory, CategoryConfig> = {
  spektakli: { color: "#e11d48", label: "Спектакли", emoji: "🎭" },
  kontserti: { color: "#2563eb", label: "Концерты", emoji: "🎵" },
  vstrechi: { color: "#16a34a", label: "Встречи", emoji: "💬" },
  obuchenie: { color: "#ca8a04", label: "Обучение", emoji: "🎓" },
  vystavki: { color: "#9333ea", label: "Выставки", emoji: "🖼️" },
  other: { color: "#6b7280", label: "Другое", emoji: "⭐" },
};

/**
 * Маппинг человекочитаемых типов gde-chto (поле type_for_search)
 * на наши категории.
 */
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
  // Всё остальное (спорт, фитнес, гастрономия, ярмарка, кино, дети, акция,
  // танцы) — "other"
};

/**
 * Категория события.
 * - Для culture.ru: genres[0].name (spectakli/kontserti/...)
 * - Для gde-chto: маппинг по genres[0].title (там мы кладём type_for_search)
 * - Для local: genres[0].name = "other" по умолчанию
 */
export function getEventCategory(event: {
  genres?: { name: string; title?: string }[];
  source?: string;
}): EventCategory {
  const g = event.genres?.[0];
  if (!g) return "other";

  // gde-chto: используем title, потому что там лежит type_for_search
  if (event.source === "gde-chto") {
    const mapped = GDE_CHTO_MAP[g.title ?? ""];
    if (mapped) return mapped;
    return "other";
  }

  // culture.ru: name — это ключ категории
  if (g.name && g.name in CATEGORY_CONFIG) return g.name as EventCategory;
  return "other";
}
