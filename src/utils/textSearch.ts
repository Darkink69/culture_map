/**
 * Проверяет, содержится ли запрос в тексте.
 * Ищем по словам: "опера" найдёт "оперу", "оперный", "оперетта".
 * Регистр и диакритика — через toLocaleLowerCase("ru").
 */
export function matchesQuery(
  text: string | undefined | null,
  query: string,
): boolean {
  if (!query) return true;
  if (!text) return false;

  const haystack = text.toLocaleLowerCase("ru");
  // Разбиваем запрос на слова и ищем каждое слово как префикс какого-либо слова текста
  const queryWords = query.toLocaleLowerCase("ru").split(/\s+/).filter(Boolean);

  if (queryWords.length === 0) return true;

  // Разбиваем текст на слова один раз
  const textWords = haystack.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  return queryWords.every((qw) => textWords.some((tw) => tw.startsWith(qw)));
}

/** Собирает поисковый текст события: title + description + topPlaceTitle. */
export function eventSearchText(event: {
  title?: string;
  description?: string;
  topPlaceTitle?: string;
}): string {
  return [event.title, event.description, event.topPlaceTitle]
    .filter(Boolean)
    .join(" ");
}
