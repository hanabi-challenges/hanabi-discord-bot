# hanabi-discord-bot

Discord bot for the [Hanabi Challenges](https://github.com/hanabi-challenges/hanabi-challenges) site. Keeps Discord role assignments in sync with site roles in real time.

## How it works

The bot listens for `GuildMemberUpdate` and `GuildMemberAdd` events. When a member's roles change, it:

1. Fetches the `discord_role_grants` mapping from the site API (cached, refreshed every 5 minutes by default)
2. Computes the member's site roles from their Discord roles
3. POSTs the updated roles to the site API

The site never polls Discord — the bot is the authoritative push source for role state.

## Environment variables

Copy `.env.example` to `.env` and fill in all values.

| Variable | Required | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | Yes | Bot token from the Discord Developer Portal |
| `DISCORD_GUILD_ID` | Yes | ID of the Discord server to monitor |
| `SITE_API_URL` | Yes | Base URL of the Hanabi Challenges API (no trailing slash) |
| `BOT_SECRET` | Yes | Shared secret for authenticating with the site API |
| `GRANTS_REFRESH_MS` | No | How often to refresh the role grants cache in ms (default: `300000` / 5 min) |

## Discord Developer Portal setup

1. Create an application at https://discord.com/developers/applications
2. Under **Bot**, enable **Server Members Intent** (required for `GuildMemberUpdate` and `GuildMemberAdd`)
3. Copy the bot token into `DISCORD_BOT_TOKEN`
4. Invite the bot to your server with the `bot` scope and no special permissions needed

## Development

```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # tsx watch — restarts on file changes
```

## Production

```bash
npm run build   # compiles TypeScript to dist/
npm start       # runs dist/index.js
```

## Role mapping

Role grants are stored in the `discord_role_grants` table on the site. Each row maps a Discord role ID to a site app role (`HOST`, `MOD`, `SITE_ADMIN`, `SUPERADMIN`). All synced members receive the base `USER` role automatically.

To add a mapping, insert a row via the site's admin interface or directly in the database:

```sql
INSERT INTO discord_role_grants (guild_id, role_id, app_role, description)
VALUES ('<guild_id>', '<discord_role_id>', 'HOST', 'Event hosts');
```
