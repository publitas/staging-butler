/**
 * Parse server status from channel topic
 * @param {string} topicText - The channel topic text
 * @returns {Object} Object containing reserved and available servers
 */
function parseServerStatus(topicText) {
  if (!topicText) {
    return { reserved: [], available: [] };
  }

  const tokens = topicText.split(/\s+/);
  const reserved = [];
  const available = [];

  for (let i = 0; i < tokens.length - 1; i++) {
    const serverMatch = tokens[i].match(/(int\d+):/);
    const emojiMatch = tokens[i + 1].match(/^:([^:]+):$/);

    if (serverMatch && emojiMatch) {
      const server = serverMatch[1];
      const emoji = tokens[i + 1];
      const emojiName = emoji.replace(/^:([^:]+):$/, '$1');

      if (emoji === ':free:') {
        available.push(server);
      } else {
        reserved.push({ server, emoji, emojiName });
      }
    }
  }

  return { reserved, available };
}

/**
 * Format server status for display
 * @param {Object} status - Object containing reserved and available servers
 * @returns {string} Formatted message for Slack
 */
function formatServerStatus({ reserved, available }) {
  // Create the status display with the suggested emojis
  let message = ''; // '📋 *Server Reservation Status*\n\n';

  // Available servers with unlock emoji
  if (available.length > 0) {
    message += `🔏 *Available*: ${available.join(', ')}`;
  } else {
    message += '🔏 *Available*: None';
  }

  message += '  \n';

  // Reserved servers with locked with key emoji
  if (reserved.length > 0) {
    message += `🔐 *Reserved*: ${reserved.map(({ server, emojiName }) =>
      `${server} (@${emojiName})`
    ).join(', ')}`;
  } else {
    message += '🔐 *Reserved*: None';
  }

  return message;
}

module.exports = {
  parseServerStatus,
  formatServerStatus
};
