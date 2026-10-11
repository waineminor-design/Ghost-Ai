// Client-side helper for the app's JSON route handlers.

export const GENERIC_REQUEST_ERROR = "Something went wrong. Please try again.";

// Thrown by sendJsonRequest when the API answers with an error status.
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

interface JsonRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  signal?: AbortSignal;
  // Lets the request finish after the page is closed. Browsers refuse
  // keepalive bodies over 64 KiB.
  keepalive?: boolean;
}

// Sends a request to an API route. Resolves with the parsed JSON body
// (null for 204); throws an ApiRequestError carrying the API's `error`
// message and the status otherwise, or an Error when the server can't be
// reached. An aborted request rethrows the abort error unchanged.
export async function sendJsonRequest(
  url: string,
  { method = "GET", body, signal, keepalive }: JsonRequestOptions = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
      keepalive,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Could not reach the server. Check your connection.");
  }

  const data: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : GENERIC_REQUEST_ERROR;
    throw new ApiRequestError(message, response.status);
  }
  return data;
}

// Message to show for an error thrown by sendJsonRequest.
export function requestErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : GENERIC_REQUEST_ERROR;
}
