// Longest design prompt POST /api/ai/design accepts, after trimming. The AI
// Architect composer stops at the same length, since every message sent
// there starts a design run. Used on both the server and the client.
export const DESIGN_PROMPT_MAX_LENGTH = 2_000;
