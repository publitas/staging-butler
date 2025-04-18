const fs = require('fs');

/**
 * Parse server status from channel topic
 * @param {string} topicText - The channel topic text
 * @returns {Object} Object containing reserved and available servers and firstline info
 */
function parseServerStatus(topicText) {
  if (!topicText) {
    return { reserved: [], available: [], firstline: null };
  }

  const tokens = topicText.split(/\s+/);
  const reserved = [];
  const available = [];
  let firstline = null;

  for (let i = 0; i < tokens.length - 1; i++) {
    // Check for firstline entry (both "firstline:" and "first line:" formats)
    const isFirstline = tokens[i].toLowerCase() === 'firstline:' || 
                       (tokens[i].toLowerCase() === 'first' && 
                        tokens[i+1] && tokens[i+1].toLowerCase() === 'line:');
    
    if (isFirstline) {
      // Skip "line:" token if we matched "first line:"
      if (tokens[i].toLowerCase() === 'first') {
        i++;
      }
      
      // Now check the next token for an emoji
      const nextIndex = i + 1;
      if (nextIndex < tokens.length) {
        const emojiMatch = tokens[nextIndex].match(/^:([^:]+):$/);
        if (emojiMatch && tokens[nextIndex] !== ':free:') {
          firstline = emojiMatch[1];
          // Skip the emoji token
          i = nextIndex;
        }
      }
      continue;
    }

    // Check for server entries
    const serverMatch = tokens[i].match(/(int\d+):/);
    const emojiMatch = tokens[i + 1] && tokens[i + 1].match(/^:([^:]+):$/);

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

  return { reserved, available, firstline };
}

/**
 * Format server status for display
 * @param {Object} status - Object containing reserved and available servers
 * @returns {string} Formatted message for Slack
 */
function formatServerStatus({ reserved, available, firstline }) {
  // Create the status display with the suggested emojis
  let message = '';

  // Available servers with unlock emoji
  if (available.length > 0) {
    message += `:lock_with_ink_pen: *Available*: ${available.join(', ')}`;
  } else {
    message += ':lock_with_ink_pen: *Available*: None';
  }

  message += '  \n';

  // Reserved servers with locked with key emoji
  if (reserved.length > 0) {
    message += `:closed_lock_with_key: *Reserved*: ${reserved.map(({ server, emojiName }) =>
      `${server} (:${emojiName}:)`
    ).join(', ')}`;
  } else {
    message += ':closed_lock_with_key: *Reserved*: None';
  }

  // Add firstline person if set
  if (firstline) {
    message += `  \n:bust_in_silhouette: *Firstline*: :${firstline}:`;
  }

  return message;
}

/**
 * Update the firstline person in a channel topic
 * @param {string} topicText - Current channel topic text
 * @param {string|null} firstlineUser - Username to set as firstline, or null to clear
 * @param {string|null} userEmoji - Emoji to use for the firstline person
 * @returns {string} Updated topic text
 */
function updateFirstlineInTopic(topicText, firstlineUser, userEmoji) {
  // Remove any existing firstline entries with various possible formats
  let updatedTopic = topicText;
  
  // Remove "firstline:" entries
  updatedTopic = updatedTopic.replace(/firstline:\s+:[^:]+:\s*/gi, '');
  
  // Remove "first line:" entries (with a space)
  updatedTopic = updatedTopic.replace(/first\s+line:\s+:[^:]+:\s*/gi, '');
  
  // Add the new firstline entry if provided
  if (firstlineUser && userEmoji) {
    // Make sure there's a space at the end
    if (updatedTopic && !updatedTopic.endsWith(' ')) {
      updatedTopic += ' ';
    }
    updatedTopic += `first line: ${userEmoji} `;
  }
  
  return updatedTopic.trim();
}

module.exports = {
  parseServerStatus,
  formatServerStatus,
  updateFirstlineInTopic
};
