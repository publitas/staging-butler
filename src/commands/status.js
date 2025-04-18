const { STAGING_CHANNEL } = require('../config');
const logger = require('../utils/logger');
const { parseServerStatus, formatServerStatus } = require('../utils/helpers');

/**
 * Handle the status command
 * @param {Object} params - Command parameters
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function statusCommand({ respond, client }) {
  try {
    const result = await client.conversations.info({ channel: STAGING_CHANNEL });
    const currentText = result.channel.topic.value || '';
    const status = parseServerStatus(currentText);

    await respond(formatServerStatus(status));
    logger.info('Status command executed successfully');
  } catch (error) {
    logger.error('Failed to retrieve server status', error);
    await respond({
      text: 'Could not retrieve the server status.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '❌ *Error:* Could not retrieve the server status.'
          }
        }
      ]
    });
  }
}

module.exports = statusCommand;
