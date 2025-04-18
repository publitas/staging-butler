const { STAGING_CHANNEL } = require('../config');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { parseServerStatus, formatServerStatus } = require('../utils/helpers');

/**
 * Handle the status command
 * @param {Object} params - Command parameters
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function statusCommand({ respond, client }) {
  try {
    // Use cached channel info instead of making API call every time
    const result = await cache.getChannelInfo(client, STAGING_CHANNEL);
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
            text: '⚠️ *Error:* Could not retrieve the server status.'
          }
        }
      ]
    });
  }
}

module.exports = statusCommand;
