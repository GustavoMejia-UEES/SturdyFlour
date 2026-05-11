import { auth, currentUser } from '@clerk/nextjs/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '../db';
import { profiles } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Fetches the currently authenticated User Profile from local DB.
 * If the user exists in Clerk but not yet in our DB, it auto-initializes 
 * them securely with the 'NEW' role.
 */
export async function getAuthenticatedProfile() {
  const session = await auth();
  if (!session.userId) return null;

  const env = getRequestContext().env;
  const db = getDb(env.DB);

  // 1. Attempt to fetch existing profile
  let profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.userId),
  });

  // 2. Safe creation on-demand if missing (Automatic Sync)
  if (!profile) {
    try {
      const [newProfile] = await db.insert(profiles).values({
        id: session.userId,
        role: 'NEW',
        stars: 0
      }).onConflictDoNothing().returning();

      // If conflict resolved with nothing, refetch to be sure
      profile = newProfile || await db.query.profiles.findFirst({
        where: eq(profiles.id, session.userId),
      });
    } catch (e) {
      console.error("Session profile sync failed", e);
      // Fallback during race conditions
    }
  }

  return profile;
}

/**
 * Helper checking if active profile matches required access tier.
 */
export async function requireRole(roles: ('NEW' | 'STUDENT' | 'EDITOR' | 'ADMIN')[]) {
  const profile = await getAuthenticatedProfile();
  if (!profile) throw new Error("Unauthorized");
  
  if (!roles.includes(profile.role as any)) {
    throw new Error("Access Denied: Insufficient Privileges");
  }
  
  return profile;
}
