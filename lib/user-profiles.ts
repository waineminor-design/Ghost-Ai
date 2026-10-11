import "server-only";

import { clerkClient, type User } from "@clerk/nextjs/server";

import { normalizeEmail, type MemberProfile } from "@/lib/collaborators";

// Clerk's user list accepts at most 100 filter values per request.
const CLERK_FILTER_LIMIT = 100;

function toProfile(user: User, email: string | null): MemberProfile {
  return {
    email,
    name: user.fullName ?? user.username,
    imageUrl: user.imageUrl,
  };
}

// Profiles for the Clerk users that own `emails`, keyed by normalized
// email. Emails with no Clerk user are missing from the map. A Clerk API
// failure is logged and yields an empty map, so callers fall back to
// showing emails only.
export async function getProfilesByEmail(
  emails: string[],
): Promise<Map<string, MemberProfile>> {
  const wanted = new Set(emails.map(normalizeEmail));
  const profiles = new Map<string, MemberProfile>();
  if (wanted.size === 0) return profiles;

  const batches: string[][] = [];
  const all = [...wanted];
  for (let i = 0; i < all.length; i += CLERK_FILTER_LIMIT) {
    batches.push(all.slice(i, i + CLERK_FILTER_LIMIT));
  }

  try {
    const client = await clerkClient();
    const results = await Promise.all(
      batches.map((batch) =>
        client.users.getUserList({
          emailAddress: batch,
          limit: CLERK_FILTER_LIMIT,
        }),
      ),
    );

    for (const { data: users } of results) {
      for (const user of users) {
        // A user can have several addresses; map each requested one.
        for (const { emailAddress } of user.emailAddresses) {
          const email = normalizeEmail(emailAddress);
          if (wanted.has(email)) profiles.set(email, toProfile(user, email));
        }
      }
    }
  } catch (error) {
    console.error("Clerk lookup of collaborator emails failed", error);
  }
  return profiles;
}

// Profile of a Clerk user by id, with their primary email. Fields are
// null when the user no longer exists or the Clerk API call fails.
export async function getProfileByUserId(
  userId: string,
): Promise<MemberProfile> {
  try {
    const client = await clerkClient();
    // getUserList returns an empty list for an unknown id, where getUser
    // would throw.
    const { data: users } = await client.users.getUserList({
      userId: [userId],
    });
    const user = users[0];
    if (user) {
      const primary = user.primaryEmailAddress?.emailAddress;
      return toProfile(user, primary ? normalizeEmail(primary) : null);
    }
  } catch (error) {
    console.error("Clerk lookup of the project owner failed", error);
  }
  return { email: null, name: null, imageUrl: null };
}
