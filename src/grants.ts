// Role grants cache — maps Discord role ID → site role.
// Refreshed from the site API on startup and periodically.

import { fetchRoleGrants } from './api.js';
import { env } from './env.js';

// Maps discord role_id → site app_role
let cache: Map<string, string> = new Map();
let lastRefresh = 0;

export async function refreshGrants(): Promise<void> {
  const grants = await fetchRoleGrants();
  cache = new Map(grants.map((g) => [g.role_id, g.app_role]));
  lastRefresh = Date.now();
  console.log(`[grants] Loaded ${cache.size} role grant(s)`);
}

/**
 * Returns the cache, refreshing first if stale.
 * Stale = older than GRANTS_REFRESH_MS (default 5 min).
 */
export async function getGrants(): Promise<Map<string, string>> {
  if (Date.now() - lastRefresh > env.GRANTS_REFRESH_MS) {
    await refreshGrants();
  }
  return cache;
}

/**
 * Given the set of Discord role IDs a member currently holds,
 * return the site roles they should have.
 * Always includes USER; adds any role mapped via the grants table.
 */
export async function computeSiteRoles(discordRoleIds: string[]): Promise<string[]> {
  const grants = await getGrants();
  const roles = new Set<string>(['USER']);
  for (const id of discordRoleIds) {
    const siteRole = grants.get(id);
    if (siteRole) roles.add(siteRole);
  }
  return [...roles];
}
