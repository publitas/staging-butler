const { STAGING_CHANNEL, PATTERNS } = require('../config');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { isValidServer } = require('../utils/validators');

/**
 * Handle the release command
 * @param {Object} params - Command parameters
 * @param {Array} params.args - Command arguments
 * @param {Object} params.command - Slack command object
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function releaseCommand({ args, command, respond, client }) {
  // If no arguments provided, ask the team if there's a server to release
  if (args.length === 0) {
    try {
      // Post a message to the channel asking about servers to release
      await client.chat.postMessage({
        channel: STAGING_CHANNEL,
        text: "Hey team 👋 @here, is there a server I can release?",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Hey team 👋 <!here>, is there a server I can release?"
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `_Posted on behalf of <@${command.user_id}>_`
              }
            ]
          }
        ]
      });
      
      await respond("Asked the team about releasing a server.");
      logger.info("Release command - asked team about releasing a server");
    } catch (error) {
      // Handle missing permissions gracefully
      if (error.code === 'slack_webapi_platform_error' && 
          error.data && error.data.error === 'missing_scope') {
        await respond("⚠️ I'd like to ask the team about releasing a server, but I need the `chat:write` permission. For now, you can post the message yourself or specify which server to release.");
        logger.warn('Could not post release question to channel - missing chat:write permission.');
      } else {
        await respond("⚠️ I couldn't post a message to the channel. You can post the message yourself or specify which server to release.");
        logger.error('Failed to post release question to channel', error);
      }
    }
    return;
  }

  const server = args[0]?.toLowerCase();

  if (!server) {
    await respond('Usage: `/reserve release <server>`');
    logger.warn('Release command failed - no server specified');
    return;
  }

  if (!isValidServer(server)) {
    await respond(`⚠️ Invalid server name: ${server}. Server names should be in the format 'int1', 'int2', etc.`);
    logger.warn(`Release command failed - invalid server name: ${server}`);
    return;
  }

  try {
    // Use cached channel info instead of making API call every time
    const result = await cache.getChannelInfo(client, STAGING_CHANNEL);
    const originalText = result.channel.topic.value || '';
    const regex = PATTERNS.SERVER_IN_TOPIC(server);

    if (!regex.test(originalText)) {
      await respond(`⚠️ No reservation found for ${server}.`);
      logger.info(`Release command - no reservation found for ${server}`);
      return;
    }

    // Make sure we preserve the firstline information when updating the topic
    const updatedText = originalText.replace(regex, `${server}: :free:`);

    await client.conversations.setTopic({
      channel: STAGING_CHANNEL,
      topic: updatedText
    });

    // Invalidate the channel info cache since we updated the topic
    cache.invalidateChannelInfo(STAGING_CHANNEL);

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
            text: `⚠️ *Error:* Could not release server ${server}. ${error.message || ''}`
          }
        }
      ]
    });
  }
}

module.exports = releaseCommand;
