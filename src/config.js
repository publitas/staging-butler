/**
 * Configuration settings for the Staging Butler app
 */

const EMOJI_MAP_PATH = process.env.EMOJI_MAP_PATH || './emoji_map.json';

const STAGING_CHANNEL = process.env.STAGING_CHANNEL;
const PORT = process.env.PORT || 3000;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

// Regular expressions for validation
const PATTERNS = {
  SERVER_NAME: /^int\d+$/i,
  EMOJI: /^:[a-z0-9_-]+:$/i,
  USER_MENTION: /^<@([A-Z0-9]+)(\|[^>]+)?>$/,
  SERVER_IN_TOPIC: (server) => new RegExp(`${server}:\\s+:([^:]+):`, 'i'),
  FREE_SERVER: (server) => new RegExp(`${server}:\\s+:free:`, 'i')
};

module.exports = {
  EMOJI_MAP_PATH,
  STAGING_CHANNEL,
  PORT,
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET,
  PATTERNS
};
