// The design agent's identity in a room's presence (avatar stack and
// cursor). Shared by the server, which sets the presence, and the client,
// which shows its thinking state. Clerk user ids start with "user_", so the
// id can't clash. The color is a concrete value because it is sent as
// Liveblocks user info, like the colors in `lib/liveblocks.ts`.
export const AI_USER = {
  id: "ghost-ai",
  info: { name: "Ghost AI", color: "#e879f9" }, // fuchsia
} as const;
