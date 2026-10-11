import "server-only";

import { google } from "@ai-sdk/google";
import { logger } from "@trigger.dev/sdk";
import type { LanguageModel } from "ai";

// The Gemini models the AI tasks (design agent, spec generator) use, in
// order: if one is overloaded, errors or doesn't answer within the
// timeout, the next is tried. Change them here.
export const AI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
] as const;

// Longest a single model call may take before moving to the next model, so
// a stalled request can't hold the run (and the AI presence) for an hour.
const MODEL_TIMEOUT_MS = 90_000;

// Each model is retried once by the AI SDK before the next one is tried.
const MODEL_MAX_RETRIES = 1;

// What each call gets: spread into `generateText` (or similar).
export type ModelCallSettings = {
  model: LanguageModel;
  abortSignal: AbortSignal;
  maxRetries: number;
};

type ModelFallbackInput<T> = {
  // Names the task in the logs (e.g. "design-agent").
  label: string;
  // The run's abort signal (run cancelled or max duration reached).
  signal: AbortSignal;
  // Called before each model after the first.
  onFallback: () => Promise<void>;
  // One model call with the given settings.
  call: (settings: ModelCallSettings) => Promise<T>;
};

// Asks each model in turn until one answers. Cancelling the run stops
// immediately; otherwise the last model's error is thrown. Only for use
// inside a Trigger.dev task (logs go to the run log).
export async function withModelFallback<T>({
  label,
  signal,
  onFallback,
  call,
}: ModelFallbackInput<T>): Promise<T> {
  let lastError: unknown;
  for (const [index, model] of AI_MODELS.entries()) {
    if (index > 0) await onFallback();
    try {
      return await call({
        model: google(model),
        abortSignal: AbortSignal.any([signal, AbortSignal.timeout(MODEL_TIMEOUT_MS)]),
        maxRetries: MODEL_MAX_RETRIES,
      });
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
      logger.warn(`${label} model call failed; trying the next model`, {
        model,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  throw lastError;
}
