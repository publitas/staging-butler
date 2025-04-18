const emojiStorage = require('../utils/emojiStorage');
const logger = require('../utils/logger');

/**
 * Handle the list-emojis command
 * @param {Object} params - Command parameters
 * @param {Function} params.respond - Function to respond to the command
 */
async function listEmojisCommand({ respond }) {
  const emojiMap = emojiStorage.load();

  if (Object.keys(emojiMap).length === 0) {
    await respond('🙈 No emoji mappings are currently set.');
    logger.info('List-emojis command executed - no mappings found');
    return;
  }

  const formatted = Object.entries(emojiMap)
    .map(([userId, emoji]) => `• <@${userId}> → ${emoji}`)
    .join('\n');

  await respond(`🗂️ *Emoji Mappings:*\n${formatted}`);
  logger.info(`List-emojis command executed - found ${Object.keys(emojiMap).length} mappings`);
}

module.exports = listEmojisCommand;
