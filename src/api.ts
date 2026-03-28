// Site API client — thin wrapper around fetch for the two bot endpoints.

import { env } from './env.js';

const headers = () => ({
  Authorization: `Bearer ${env.BOT_SECRET}`,
  'Content-Type': 'application/json',
});

export type RoleGrant = {
  guild_id: string;
  role_id: string;
  app_role: string;
  description: string | null;
};

/**
 * Fetch the current Discord role ID → site role mapping from the site.
 * Called on startup and periodically to refresh the cache.
 */
export async function fetchRoleGrants(): Promise<RoleGrant[]> {
  const res = await fetch(`${env.SITE_API_URL}/api/bot/role-grants`, {
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch role grants: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<RoleGrant[]>;
}

/**
 * Push a user's updated site roles to the site.
 * Returns false if the user has no linked account (404), true on success.
 * Throws on unexpected errors.
 */
export async function pushRoles(discordId: string, roles: string[]): Promise<boolean> {
  const res = await fetch(`${env.SITE_API_URL}/api/bot/roles`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ discord_id: discordId, roles }),
  });
  if (res.status === 404) return false;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to push roles: ${res.status} ${body}`);
  }
  return true;
}
