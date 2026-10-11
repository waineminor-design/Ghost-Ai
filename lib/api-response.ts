import "server-only";

// Error responses share one shape: `{ error: string }`.
export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export type JsonObject = Record<string, unknown>;

// The body as text, or null once it exceeds `maxBytes`. Counts bytes as
// they stream in, so a missing or wrong Content-Length can't get a larger
// body read.
async function readTextWithLimit(
  request: Request,
  maxBytes: number,
): Promise<string | null> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > maxBytes) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

// Parses the request body as a JSON object. Returns null for invalid JSON,
// a non-object body (array, string, null, ...) or, with `maxBytes`, a body
// larger than that. With `allowEmpty`, an empty body reads as `{}`.
export async function readJsonObject(
  request: Request,
  {
    allowEmpty = false,
    maxBytes,
  }: { allowEmpty?: boolean; maxBytes?: number } = {},
): Promise<JsonObject | null> {
  const text =
    maxBytes === undefined
      ? await request.text()
      : await readTextWithLimit(request, maxBytes);
  if (text === null) return null;
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
