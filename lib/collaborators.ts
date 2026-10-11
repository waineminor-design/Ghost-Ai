// Shared by the collaborator API routes and the share dialog.

// Clerk profile data shown next to an email. `name` and `imageUrl` are
// null when no Clerk user has that email (the UI then shows the email
// with a generic avatar).
export interface MemberProfile {
  email: string | null;
  name: string | null;
  imageUrl: string | null;
}

export interface CollaboratorProfile extends MemberProfile {
  // ProjectCollaborator row id; used to remove the collaborator.
  id: string;
  email: string;
}

// GET /api/projects/:projectId/collaborators
export interface ProjectMembers {
  owner: MemberProfile;
  collaborators: CollaboratorProfile[];
}

// RFC 5321 limit for a forward path.
export const EMAIL_MAX_LENGTH = 254;

// One "@", no whitespace, and a dot in the domain. Deliberately loose:
// the address only has to match the email a user signs in with.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Collaborator emails are stored and compared in this form.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Expects a normalized email.
export function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email);
}
