export type EventCategory =
  | "spektakli" // Спектакли
  | "kontserti" // Концерты
  | "vstrechi" // Встречи
  | "obuchenie" // Обучение
  | "vystavki" // Выставки
  | "other"; // Всё остальное

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

export function getEventCategory(event: {
  genres?: { name: string }[];
}): EventCategory {
  const name = event.genres?.[0]?.name;
  if (name && name in CATEGORY_CONFIG) return name as EventCategory;
  return "other";
}
