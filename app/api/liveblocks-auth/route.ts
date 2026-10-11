import { jsonError, readJsonObject } from "@/lib/api-response";
import { getUserColor, liveblocks } from "@/lib/liveblocks";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

// Liveblocks limits room ids to 128 characters.
const ROOM_ID_MAX_LENGTH = 128;

// POST /api/liveblocks-auth — body `{ room: string }`, sent by the
// Liveblocks client. The room id is the project id. Owner or collaborator
// gets an access token for that one room; anyone else gets 403.
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object", 400);

  const { room } = body;
  // `*` would make the room a prefix pattern covering other rooms.
  if (
    typeof room !== "string" ||
    room === "" ||
    room.length > ROOM_ID_MAX_LENGTH ||
    room.includes("*")
  ) {
    return jsonError("room must be a valid room id", 400);
  }

  const access = await getProjectAccess(room, identity);
  if (!access) return jsonError("Forbidden", 403);

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name: identity.name ?? "Anonymous",
      avatar: identity.imageUrl ?? undefined,
      color: getUserColor(identity.userId),
    },
  });
  // Full access to this project's room only; never a wildcard.
  session.allow(access.project.id, ["*:write"]);

  const { status, body: authBody, error } = await session.authorize();
  if (error) console.error("Liveblocks authorization failed", error);
  return new Response(authBody, { status });
}
