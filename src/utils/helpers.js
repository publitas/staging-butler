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

      if (emoji === ':free:') {
        available.push(`• ${server}`);
      } else {
        reserved.push(`• ${server}${emoji ? ` → ${emoji}` : ''}`);
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
  const responseLines = ['*🖥️ Server Reservations*', ''];

  responseLines.push('*Reserved:*');
  responseLines.push(reserved.length ? reserved.join('\n') : 'None');
  responseLines.push('');

  responseLines.push('*Available:*');
  responseLines.push(available.length ? available.join('\n') : 'None');

  return responseLines.join('\n');
}

module.exports = {
  parseServerStatus,
  formatServerStatus
};
