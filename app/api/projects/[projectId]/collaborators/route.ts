import { jsonError, readJsonObject } from "@/lib/api-response";
import {
  isValidEmail,
  normalizeEmail,
  type CollaboratorProfile,
  type ProjectMembers,
} from "@/lib/collaborators";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import { addCollaborator, listCollaborators } from "@/lib/project-data";
import { getProfileByUserId, getProfilesByEmail } from "@/lib/user-profiles";

// GET /api/projects/:projectId/collaborators — the owner and the
// collaborators with Clerk profile data. Owner or collaborator; anyone
// else gets 404 so the project's existence is not revealed.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">,
) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const { projectId } = await ctx.params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);

  const rows = await listCollaborators(projectId);
  const [owner, profiles] = await Promise.all([
    getProfileByUserId(access.project.ownerId),
    getProfilesByEmail(rows.map((row) => row.email)),
  ]);

  const members: ProjectMembers = {
    owner,
    collaborators: rows.map(({ id, email }) => {
      const profile = profiles.get(normalizeEmail(email));
      return {
        id,
        email,
        name: profile?.name ?? null,
        imageUrl: profile?.imageUrl ?? null,
      };
    }),
  };
  return Response.json(members);
}

// POST /api/projects/:projectId/collaborators — body `{ email: string }`.
// Owner only; collaborators get 403.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">,
) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object", 400);

  if (typeof body.email !== "string") {
    return jsonError("email is required", 400);
  }
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) {
    return jsonError("Enter a valid email address", 400);
  }

  const { projectId } = await ctx.params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);
  if (access.role !== "owner") return jsonError("Forbidden", 403);

  // The signed-in user is the owner here.
  if (identity.email && normalizeEmail(identity.email) === email) {
    return jsonError("You already own this project", 400);
  }

  const row = await addCollaborator(projectId, email);
  if (!row) {
    return jsonError(`${email} is already a collaborator`, 409);
  }

  const profile = (await getProfilesByEmail([email])).get(email);
  const collaborator: CollaboratorProfile = {
    id: row.id,
    email: row.email,
    name: profile?.name ?? null,
    imageUrl: profile?.imageUrl ?? null,
  };
  return Response.json(collaborator, { status: 201 });
}
