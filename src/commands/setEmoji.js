const emojiStorage = require('../utils/emojiStorage');
const logger = require('../utils/logger');
const { isValidEmoji, findUserId } = require('../utils/validators');

/**
 * Handle the set-emoji command
 * @param {Object} params - Command parameters
 * @param {Array} params.args - Command arguments
 * @param {Object} params.command - Slack command object
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function setEmojiCommand({ args, command, respond, client }) {
  let userId;
  let emoji;

  if (args.length === 1) {
    userId = command.user_id;
    emoji = args[0];
  } else if (args.length === 2) {
    const userMention = args[0];
    emoji = args[1];

    userId = await findUserId(userMention, client);

    if (!userId) {
      await respond('⚠️ Could not find user. Mention them properly or use their exact Slack @name.');
      logger.warn(`Set-emoji failed - user not found: ${userMention}`);
      return;
    }
  } else {
    await respond('Usage: `/reserve set-emoji :emoji:` or `/reserve set-emoji @user :emoji:`');
    logger.warn('Set-emoji failed - incorrect usage');
    return;
  }

  if (!isValidEmoji(emoji)) {
    await respond('⚠️ Invalid emoji format. Please use a valid Slack emoji like `:smile:`.');
    logger.warn(`Set-emoji failed - invalid emoji format: ${emoji}`);
    return;
  }

  const emojiMap = emojiStorage.load();
  emojiMap[userId] = emoji;

  if (emojiStorage.save(emojiMap)) {
    await respond(`Mapped <@${userId}> to ${emoji}`);
    logger.info(`Set-emoji successful - mapped user ${userId} to ${emoji}`);
  } else {
    await respond('⚠️ Failed to save emoji mapping. Please try again later.');
    logger.error('Set-emoji failed - could not save emoji map');
  }
}

module.exports = setEmojiCommand;
