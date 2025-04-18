const { STAGING_CHANNEL, PATTERNS } = require('../config');
const logger = require('../utils/logger');
const emojiStorage = require('../utils/emojiStorage');
const { isValidServer, findUserId } = require('../utils/validators');

/**
 * Handle the reserve command (default)
 * @param {Object} params - Command parameters
 * @param {string} params.server - Server to reserve
 * @param {Array} params.args - Command arguments
 * @param {Object} params.command - Slack command object
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function reserveCommand({ server, args, command, respond, client }) {
  if (!server) {
    await respond('Usage: `/reserve <server>` to check status or `/reserve <server> @user` to reserve');
    logger.warn('Reserve command failed - no server specified');
    return;
  }

  if (!isValidServer(server)) {
    await respond(`❌ Invalid server name: ${server}. Server names should be in the format 'int1', 'int2', etc.`);
    logger.warn(`Reserve command failed - invalid server name: ${server}`);
    return;
  }

  try {
    const result = await client.conversations.info({ channel: STAGING_CHANNEL });
    const originalText = result.channel.topic.value || '';

    // Check if server is mentioned in the topic
    const serverRegex = PATTERNS.SERVER_IN_TOPIC(server);
    const serverMatch = originalText.match(serverRegex);

    // Information mode - no arguments, just show who has the server
    if (args.length === 0) {
      if (!serverMatch) {
        await respond(`Server ${server} is not found in the channel topic.`);
        return;
      }

      const freeRegex = PATTERNS.FREE_SERVER(server);
      if (freeRegex.test(originalText)) {
        await respond(`Server ${server} is currently available.`);
      } else {
        // Extract emoji from the match
        const emojiMatch = originalText.match(new RegExp(`${server}:\\s+:([^:]+):`, 'i'));
        if (emojiMatch && emojiMatch[1]) {
          const emojiName = emojiMatch[1];
          await respond(`Server ${server} is currently reserved by @${emojiName}.`);
        } else {
          await respond(`Server ${server} is currently reserved.`);
        }
      }
      return;
    }

    // Action mode - with user argument, reserve the server for that user
    const userMention = args[0];
    const targetUserId = await findUserId(userMention, client);

    if (!targetUserId) {
      await respond('❌ Could not find user. Mention them properly or use their exact Slack @name.');
      logger.warn(`Reserve command failed - user not found: ${userMention}`);
      return;
    }

    // Get the emoji for the target user
    const emojiMap = emojiStorage.load();
    const emoji = emojiMap[targetUserId];

    if (!emoji) {
      await respond(`User <@${targetUserId}> doesn't have an emoji set. They need to set one using \`/reserve set-emoji :emoji:\``);
      logger.warn(`Reserve command failed - no emoji set for user ${targetUserId}`);
      return;
    }

    // Check if server is available
    const freeRegex = PATTERNS.FREE_SERVER(server);
    if (!freeRegex.test(originalText)) {
      await respond(`Server ${server} is already reserved.`);
      logger.info(`Reserve command - server ${server} already reserved`);
      return;
    }

    // Reserve the server
    const updatedText = originalText.replace(freeRegex, `${server}: ${emoji}`);

    await client.conversations.setTopic({
      channel: STAGING_CHANNEL,
      topic: updatedText
    });

    await respond(`Server ${server} has been reserved for <@${targetUserId}> with ${emoji}`);
    logger.info(`Reserve command successful - reserved ${server} for user ${targetUserId} with ${emoji}`);
  } catch (error) {
    logger.error(`Failed to reserve server ${server}`, error);
    await respond({
      text: `Error: ${error.message || 'Something went wrong.'}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *Error:* Could not process server ${server}. ${error.message || ''}`
          }
        }
      ]
    });
  }
}

module.exports = reserveCommand;
