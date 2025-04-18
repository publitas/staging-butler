const { STAGING_CHANNEL } = require('../config');
const logger = require('../utils/logger');
const { findUserId } = require('../utils/validators');
const { parseServerStatus, updateFirstlineInTopic } = require('../utils/helpers');
const emojiStorage = require('../utils/emojiStorage');
const cache = require('../utils/cache');

/**
 * Handle the firstline command
 * @param {Object} params - Command parameters
 * @param {Array} params.args - Command arguments
 * @param {Object} params.command - Slack command object
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function firstlineCommand({ args, command, respond, client }) {
  try {
    // Use cached channel info instead of making API call every time
    const result = await cache.getChannelInfo(client, STAGING_CHANNEL);
    const currentTopic = result.channel.topic.value || '';
    const status = parseServerStatus(currentTopic);
    
    // If no arguments, show current firstline person
    if (args.length === 0) {
      if (!status.firstline) {
        await respond('⚠️ No firstline person is currently set. Use `/reserve firstline @username` to set one.');
        return;
      }
      
      await respond(`Current firstline person: :${status.firstline}:`);
      return;
    }
    
    // Set new firstline person
    const userMention = args[0];
    const userId = await findUserId(userMention, client);
    
    if (!userId) {
      await respond('⚠️ Could not find user. Mention them properly or use their exact Slack @name.');
      logger.warn(`Firstline command failed - user not found: ${userMention}`);
      return;
    }
    
    // Get the user's emoji from the emoji map
    const emojiMap = emojiStorage.load();
    const userEmoji = emojiMap[userId];
    
    if (!userEmoji) {
      await respond(`⚠️ User <@${userId}> doesn't have an emoji set. They need to set one using \`/reserve set-emoji :emoji:\` or \`/reserve set-emoji @user :emoji:\``);
      logger.warn(`Firstline command failed - no emoji set for user ${userId}`);
      return;
    }
    
    // Get the user info to get their username
    const userInfo = await client.users.info({ user: userId });
    const username = userInfo.user.name;
    
    logger.info(`Setting firstline - User ID: ${userId}, Username: ${username}, Emoji: ${userEmoji}`);
    
    // Update the topic with the new firstline person
    const updatedTopic = updateFirstlineInTopic(currentTopic, username, userEmoji);
    
    logger.info(`Current topic: "${currentTopic}"`);
    logger.info(`Updated topic: "${updatedTopic}"`);
    
    await client.conversations.setTopic({
      channel: STAGING_CHANNEL,
      topic: updatedTopic
    });
    
    // Invalidate the channel info cache since we updated the topic
    cache.invalidateChannelInfo(STAGING_CHANNEL);
    
    await respond(`${userEmoji} is now set as the firstline person.`);
    logger.info(`Firstline command successful - set user ${username} as firstline`);
  } catch (error) {
    logger.error('Failed to execute firstline command', error);
    await respond('⚠️ Failed to update the firstline person. Please try again later.');
  }
}

module.exports = firstlineCommand;
