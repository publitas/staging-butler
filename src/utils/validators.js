const { PATTERNS } = require('../config');
const logger = require('./logger');
const cache = require('./cache');

/**
 * Validate if a string is a valid server name
 * @param {string} server - Server name to validate
 * @returns {boolean} True if valid
 */
function isValidServer(server) {
  return server && PATTERNS.SERVER_NAME.test(server);
}

/**
 * Validate if a string is a valid emoji
 * @param {string} emoji - Emoji to validate
 * @returns {boolean} True if valid
 */
function isValidEmoji(emoji) {
  return emoji && PATTERNS.EMOJI.test(emoji);
}

/**
 * Find a user by name or mention
 * @param {string} userMention - User mention or name
 * @param {Object} client - Slack client
 * @returns {Promise<string|null>} User ID or null if not found
 */
async function findUserId(userMention, client) {
  if (!userMention) {
    return null;
  }

  const mentionMatch = userMention.match(PATTERNS.USER_MENTION);

  if (mentionMatch) {
    return mentionMatch[1];
  }

  try {
    // Use cached user list instead of making API call every time
    const usersList = await cache.getUsersList(client);
    const plainTextUsername = userMention.replace(/^@/, '').toLowerCase();

    const user = usersList.members.find((u) => {
      const name = u.name?.toLowerCase();
      const real = u.real_name?.toLowerCase();
      const display = u.profile?.display_name?.toLowerCase();
      return name === plainTextUsername || real === plainTextUsername || display === plainTextUsername;
    });

    return user ? user.id : null;
  } catch (error) {
    logger.error('Could not look up users', error);
    return null;
  }
}

module.exports = {
  isValidServer,
  isValidEmoji,
  findUserId
};
