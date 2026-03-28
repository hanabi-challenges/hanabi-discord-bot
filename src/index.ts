import {
  Client,
  Events,
  GatewayIntentBits,
  type GuildMember,
  type PartialGuildMember,
} from 'discord.js';
import { env } from './env.js';
import { refreshGrants, computeSiteRoles } from './grants.js';
import { pushRoles } from './api.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// ---------------------------------------------------------------------------
// Role sync
// ---------------------------------------------------------------------------

async function syncMember(member: GuildMember): Promise<void> {
  const discordRoleIds = [...member.roles.cache.keys()];
  const siteRoles = await computeSiteRoles(discordRoleIds);
  const linked = await pushRoles(member.user.id, siteRoles);
  if (linked) {
    console.log(`[sync] ${member.user.tag} → [${siteRoles.join(', ')}]`);
  }
  // 404 (not linked) is silently ignored — expected for members who haven't
  // connected their Discord account to the site yet.
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

client.once(Events.ClientReady, async (c) => {
  console.log(`[ready] Logged in as ${c.user.tag}`);

  // Load role grants before handling any events
  await refreshGrants();

  // Schedule periodic cache refresh
  setInterval(() => {
    refreshGrants().catch((err) => console.error('[grants] Refresh failed:', err));
  }, env.GRANTS_REFRESH_MS);
});

// Fires when a member's roles (or other attributes) change.
client.on(
  Events.GuildMemberUpdate,
  async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    if (newMember.guild.id !== env.DISCORD_GUILD_ID) return;

    // Only process if roles actually changed
    const oldIds = new Set(oldMember.roles.cache.keys());
    const newIds = new Set(newMember.roles.cache.keys());
    const changed =
      [...oldIds].some((id) => !newIds.has(id)) || [...newIds].some((id) => !oldIds.has(id));
    if (!changed) return;

    try {
      await syncMember(newMember);
    } catch (err) {
      console.error(`[sync] Error syncing ${newMember.user.tag}:`, err);
    }
  },
);

// Fires when a member joins — push their roles in case they already have relevant ones.
client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  if (member.guild.id !== env.DISCORD_GUILD_ID) return;
  try {
    await syncMember(member);
  } catch (err) {
    console.error(`[sync] Error on member join ${member.user.tag}:`, err);
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

client.login(env.DISCORD_BOT_TOKEN).catch((err) => {
  console.error('[fatal] Failed to log in:', err);
  process.exit(1);
});
