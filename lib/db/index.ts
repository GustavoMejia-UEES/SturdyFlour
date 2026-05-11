import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Helper function to get the DB instance in Edge requests.
// In Next.js on Pages, RequestContext is used to access bindings.
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
