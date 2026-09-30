/**
 * Vercel Serverless Function.
 * Проверяет доступность culture.ru из серверной среды Vercel.
 *
 * GET /api/check-culture?url=https://www.culture.ru/
 *
 * Возвращает:
 *   - ok: true/false
 *   - status: HTTP-статус culture.ru (если удалось)
 *   - htmlLength: длина полученного HTML
 *   - snippet: первые 200 символов HTML
 *   - error: сообщение об ошибке (если что-то упало)
 *   - durationMs: сколько занял запрос
 *   - vercel: { region, ip }
 */

import process from "process";

export const config = {
  // Функция должна ходить в сеть, поэтому runtime — Edge или Node.
  // Используем Node.js runtime — стабильнее для fetch на внешние ресурсы.
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  const url =
    typeof req.query?.url === "string"
      ? req.query.url
      : "https://www.culture.ru/";

  const start = Date.now();
  const result: Record<string, unknown> = {
    testedUrl: url,
    requestedAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        // Эмулируем браузер — некоторые сайты иначе сразу рвут соединение
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
      },
      // Ограничим время ожидания — иначе функция может висеть до таймаута Vercel
      signal: AbortSignal.timeout(15_000),
    });

    result.ok = response.ok;
    result.status = response.status;
    result.statusText = response.statusText;
    result.contentType = response.headers.get("content-type");
    result.contentLengthHeader = response.headers.get("content-length");

    const html = await response.text();
    result.htmlLength = html.length;
    result.snippet = html.slice(0, 200);

    // Проверим, что это действительно culture.ru, а не заглушка
    result.hasCultureTitle = html.includes("Культура.РФ");
    result.hasNextData = html.includes("__NEXT_DATA__");
  } catch (e) {
    result.ok = false;
    result.error = e instanceof Error ? e.message : String(e);
    result.errorName = e instanceof Error ? e.name : null;
    // Отдельно отловить код причины, если есть
    if (e && typeof e === "object" && "cause" in e) {
      const cause = (e as { cause?: unknown }).cause;
      result.cause = cause instanceof Error ? cause.message : String(cause);
    }
  }

  result.durationMs = Date.now() - start;
  result.vercel = {
    region: process.env.VERCEL_REGION ?? "unknown",
    // IP получим из заголовка, но это IP клиента, не сервера.
    // IP сервера Vercel нам недоступен напрямую.
    deploymentUrl: process.env.VERCEL_URL ?? "unknown",
  };

  // Всегда 200, чтобы удобно было читать JSON в браузере.
  res.status(200).json(result);
}
