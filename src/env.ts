function require(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

export const env = {
  DISCORD_BOT_TOKEN: require('DISCORD_BOT_TOKEN'),
  DISCORD_GUILD_ID: require('DISCORD_GUILD_ID'),
  SITE_API_URL: require('SITE_API_URL').replace(/\/$/, ''),
  BOT_SECRET: require('BOT_SECRET'),
  GRANTS_REFRESH_MS: Number(process.env.GRANTS_REFRESH_MS ?? '300000'),
};
