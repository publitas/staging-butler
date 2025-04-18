const { STAGING_CHANNEL, PATTERNS } = require('../config');
const logger = require('../utils/logger');
const { isValidServer } = require('../utils/validators');

/**
 * Handle the release command
 * @param {Object} params - Command parameters
 * @param {Array} params.args - Command arguments
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function releaseCommand({ args, respond, client }) {
  const server = args[0]?.toLowerCase();

  if (!server) {
    await respond('Usage: `/reserve release <server>`');
    logger.warn('Release command failed - no server specified');
    return;
  }

  if (!isValidServer(server)) {
    await respond(`❌ Invalid server name: ${server}. Server names should be in the format 'int1', 'int2', etc.`);
    logger.warn(`Release command failed - invalid server name: ${server}`);
    return;
  }

  try {
    const result = await client.conversations.info({ channel: STAGING_CHANNEL });
    const originalText = result.channel.topic.value || '';
    const regex = PATTERNS.SERVER_IN_TOPIC(server);

    if (!regex.test(originalText)) {
      await respond(`No reservation found for ${server}.`);
      logger.info(`Release command - no reservation found for ${server}`);
      return;
    }

    const updatedText = originalText.replace(regex, `${server}: :free:`);

    await client.conversations.setTopic({
      channel: STAGING_CHANNEL,
      topic: updatedText
    });

    await respond(`Server ${server} has been released and marked as :free:`);
    logger.info(`Release command successful - released ${server}`);
  } catch (error) {
    logger.error(`Failed to release server ${server}`, error);
    await respond({
      text: 'Something went wrong while releasing the server.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *Error:* Could not release server ${server}. ${error.message || ''}`
          }
        }
      ]
    });
  }
}

module.exports = releaseCommand;
