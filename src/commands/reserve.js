const { STAGING_CHANNEL, PATTERNS } = require('../config');
const logger = require('../utils/logger');
const emojiStorage = require('../utils/emojiStorage');
const { isValidServer } = require('../utils/validators');

/**
 * Handle the reserve command (default)
 * @param {Object} params - Command parameters
 * @param {string} params.server - Server to reserve
 * @param {Object} params.command - Slack command object
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function reserveCommand({ server, command, respond, client }) {
  const userId = command.user_id;
  const emojiMap = emojiStorage.load();
  const emoji = emojiMap[userId];

  if (!server) {
    await respond('Usage: `/reserve <server>` — but first set your emoji using `/reserve set-emoji :emoji:`');
    logger.warn('Reserve command failed - no server specified');
    return;
  }

  if (!isValidServer(server)) {
    await respond(`❌ Invalid server name: ${server}. Server names should be in the format 'int1', 'int2', etc.`);
    logger.warn(`Reserve command failed - invalid server name: ${server}`);
    return;
  }

  if (!emoji) {
    await respond('You need to set your emoji first using `/reserve set-emoji :emoji:`');
    logger.warn(`Reserve command failed - no emoji set for user ${userId}`);
    return;
  }

  try {
    const result = await client.conversations.info({ channel: STAGING_CHANNEL });
    const originalText = result.channel.topic.value || '';
    const regex = PATTERNS.FREE_SERVER(server);

    if (!regex.test(originalText)) {
      await respond(`Server ${server} is already reserved.`);
      logger.info(`Reserve command - server ${server} already reserved`);
      return;
    }

    const updatedText = originalText.replace(regex, `${server}: ${emoji}`);

    await client.conversations.setTopic({
      channel: STAGING_CHANNEL,
      topic: updatedText
    });

    await respond(`Server ${server} has been reserved with ${emoji}`);
    logger.info(`Reserve command successful - reserved ${server} with ${emoji}`);
  } catch (error) {
    logger.error(`Failed to reserve server ${server}`, error);
    await respond({
      text: `Error: ${error.message || 'Something went wrong.'}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *Error:* Could not reserve server ${server}. ${error.message || ''}`
          }
        }
      ]
    });
  }
}

module.exports = reserveCommand;
