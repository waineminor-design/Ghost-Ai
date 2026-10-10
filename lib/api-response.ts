import "server-only";

// Error responses share one shape: `{ error: string }`.
export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export type JsonObject = Record<string, unknown>;

// Parses the request body as a JSON object. Returns null for invalid JSON
// or a non-object body (array, string, null, ...). With `allowEmpty`, an
// empty body reads as `{}`.
export async function readJsonObject(
  request: Request,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): Promise<JsonObject | null> {
  const text = await request.text();
  if (allowEmpty && text.trim() === "") return {};

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }
  return body as JsonObject;
}
