import { cookies } from 'next/headers';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '../db';
import { profiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from './jwt';

/**
 * Fetches the currently authenticated User Profile from local DB by verifying custom JWT cookie.
 */
export async function getAuthenticatedProfile() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const env = getRequestContext().env;
    const jwtSecret = (env as any).JWT_SECRET as string | undefined;

    // Verify valid signature and expiry
    const payload = await verifyToken(token, jwtSecret);
    if (!payload) return null;

    const db = getDb(env.DB);

    // Fetch full profile row from D1 by the parsed UUID inside token
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, payload.userId),
    });

    return profile || null;
  } catch (e) {
    console.error("Auth retrieval system failed", e);
    return null;
  }
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
