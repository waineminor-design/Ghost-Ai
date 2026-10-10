import { auth, currentUser } from "@clerk/nextjs/server";

import { jsonError, readJsonObject } from "@/lib/api-response";
import { createProject, listProjectsForUser } from "@/lib/project-data";
import { DEFAULT_PROJECT_NAME, PROJECT_NAME_MAX_LENGTH } from "@/lib/projects";

// GET /api/projects — `{ owned, shared }` for the signed-in user.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  // Shared projects match collaborator rows by the primary email.
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const projects = await listProjectsForUser(userId, email);
  return Response.json(projects);
}

// POST /api/projects — body `{ name?: string }`. The owner is always the
// signed-in user; any owner id in the body is ignored.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const body = await readJsonObject(request, { allowEmpty: true });
  if (!body) return jsonError("Request body must be a JSON object", 400);

  const rawName = body.name;
  if (rawName !== undefined && typeof rawName !== "string") {
    return jsonError("name must be a string", 400);
  }

  const name = rawName?.trim() || DEFAULT_PROJECT_NAME;
  if (name.length > PROJECT_NAME_MAX_LENGTH) {
    return jsonError(
      `name must be at most ${PROJECT_NAME_MAX_LENGTH} characters`,
      400,
    );
  }

  const project = await createProject(userId, name);
  return Response.json(project, { status: 201 });
}
