const { STAGING_CHANNEL } = require('../config');
const logger = require('../utils/logger');
const { findUserId } = require('../utils/validators');
const fs = require('fs');

// Path to store the firstline person data
const FIRSTLINE_PATH = './firstline.json';

/**
 * Load firstline data from file
 * @returns {Object} Firstline data
 */
function loadFirstlineData() {
  try {
    if (!fs.existsSync(FIRSTLINE_PATH)) {
      return { userId: null, timestamp: null };
    }
    return JSON.parse(fs.readFileSync(FIRSTLINE_PATH, 'utf8'));
  } catch (error) {
    logger.error(`Failed to load firstline data from ${FIRSTLINE_PATH}`, error);
    return { userId: null, timestamp: null };
  }
}

/**
 * Save firstline data to file
 * @param {Object} data - Firstline data to save
 * @returns {boolean} Success or failure
 */
function saveFirstlineData(data) {
  try {
    fs.writeFileSync(FIRSTLINE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    logger.error(`Failed to save firstline data to ${FIRSTLINE_PATH}`, error);
    return false;
  }
}

/**
 * Handle the firstline command
 * @param {Object} params - Command parameters
 * @param {Array} params.args - Command arguments
 * @param {Object} params.command - Slack command object
 * @param {Function} params.respond - Function to respond to the command
 * @param {Object} params.client - Slack client
 */
async function firstlineCommand({ args, command, respond, client }) {
  // If no arguments, show current firstline person
  if (args.length === 0) {
    const firstlineData = loadFirstlineData();
    
    if (!firstlineData.userId) {
      await respond('No firstline person is currently set. Use `/reserve firstline @username` to set one.');
      return;
    }
    
    const timestamp = new Date(firstlineData.timestamp).toLocaleString();
    await respond(`Current firstline person: <@${firstlineData.userId}> (set on ${timestamp})`);
    return;
  }
  
  // Set new firstline person
  const userMention = args[0];
  const userId = await findUserId(userMention, client);
  
  if (!userId) {
    await respond('❌ Could not find user. Mention them properly or use their exact Slack @name.');
    logger.warn(`Firstline command failed - user not found: ${userMention}`);
    return;
  }
  
  // Save the new firstline person
  const firstlineData = {
    userId,
    timestamp: new Date().toISOString()
  };
  
  if (saveFirstlineData(firstlineData)) {
    await respond(`✅ <@${userId}> is now set as the firstline person.`);
    logger.info(`Firstline command successful - set user ${userId} as firstline`);
    
    // Also post a message to the staging channel
    try {
      await client.chat.postMessage({
        channel: STAGING_CHANNEL,
        text: `🔔 <@${userId}> is now the firstline person for staging server issues.`
      });
    } catch (error) {
      logger.error('Failed to post firstline update to channel', error);
    }
  } else {
    await respond('❌ Failed to save firstline data. Please try again later.');
    logger.error('Firstline command failed - could not save data');
  }
}

module.exports = firstlineCommand;
