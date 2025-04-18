const { App } = require('@slack/bolt');
const fs = require('fs');

const logger = {
  /**
   * Log an info message
   * @param {string} message - The message to log
   * @param {Object} [data] - Optional data to include
   */
  info(message, data) {
    console.log(`[INFO] ${message}`, data ? data : '');
  },

  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {Object} [data] - Optional data to include
   */
  warn(message, data) {
    console.warn(`[WARN] ${message}`, data ? data : '');
  },

  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {Error|Object} [error] - Optional error to include
   */
  error(message, error) {
    console.error(`[ERROR] ${message}`, error ? error : '');
  }
};

const EMOJI_MAP_PATH = './emoji_map.json';
const STAGING_CHANNEL = process.env.STAGING_CHANNEL;
const PORT = process.env.PORT || 3000;

// Regular expressions for validation
const PATTERNS = {
  SERVER_NAME: /^int\d+$/i,
  EMOJI: /^:[a-z0-9_-]+:$/i,
  USER_MENTION: /^<@([A-Z0-9]+)(\|[^>]+)?>$/,

  SERVER_IN_TOPIC: (server) => new RegExp(`${server}:\\s+:([^:]+):`, 'i'),
  FREE_SERVER: (server) => new RegExp(`${server}:\\s+:free:`, 'i')
};

if (!STAGING_CHANNEL) {
  logger.error('STAGING_CHANNEL is not set. Exiting.');
  process.exit(1);
}

if (!process.env.SLACK_BOT_TOKEN) {
  logger.error('SLACK_BOT_TOKEN is not set. Exiting.');
  process.exit(1);
}

if (!process.env.SLACK_SIGNING_SECRET) {
  logger.error('SLACK_SIGNING_SECRET is not set. Exiting.');
  process.exit(1);
}

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const emojiStorage = {
  /**
   * Load emoji mappings from the file system
   * @returns {Object} Map of user IDs to emojis
   */
  load() {
    try {
      if (!fs.existsSync(EMOJI_MAP_PATH)) {
        logger.info(`Emoji map file not found at ${EMOJI_MAP_PATH}, creating empty map`);
        return {};
      }

      const data = fs.readFileSync(EMOJI_MAP_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Failed to load emoji map from ${EMOJI_MAP_PATH}`, error);
      return {};
    }
  },

  /**
   * Save emoji mappings to the file system
   * @param {Object} map - Map of user IDs to emojis
   * @returns {boolean} Success or failure
   */
  save(map) {
    try {
      fs.writeFileSync(EMOJI_MAP_PATH, JSON.stringify(map, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to save emoji map to ${EMOJI_MAP_PATH}`, error);
      return false;
    }
  }
};

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

/**
 * Validate if a string is a valid server name
 * @param {string} server - Server name to validate
 * @returns {boolean} True if valid
 */
function isValidServer(server) {
  return server && PATTERNS.SERVER_NAME.test(server);
}

/**
 * Validate if a string is a valid emoji
 * @param {string} emoji - Emoji to validate
 * @returns {boolean} True if valid
 */
function isValidEmoji(emoji) {
  return emoji && PATTERNS.EMOJI.test(emoji);
}

/**
 * Find a user by name or mention
 * @param {string} userMention - User mention or name
 * @param {Object} client - Slack client
 * @returns {Promise<string|null>} User ID or null if not found
 */
async function findUserId(userMention, client) {
  if (!userMention) {
    return null;
  }

  const mentionMatch = userMention.match(PATTERNS.USER_MENTION);

  if (mentionMatch) {
    return mentionMatch[1];
  }

  try {
    const usersList = await client.users.list();
    const plainTextUsername = userMention.replace(/^@/, '').toLowerCase();

    const user = usersList.members.find((u) => {
      const name = u.name?.toLowerCase();
      const real = u.real_name?.toLowerCase();
      const display = u.profile?.display_name?.toLowerCase();
      return name === plainTextUsername || real === plainTextUsername || display === plainTextUsername;
    });

    return user ? user.id : null;
  } catch (error) {
    logger.error('Could not look up users', error);
    return null;
  }
}

const commandHandlers = {
  /**
   * Handle the status command
   * @param {Object} params - Command parameters
   * @param {Function} params.respond - Function to respond to the command
   * @param {Object} params.client - Slack client
   */
  async status({ respond, client }) {
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
  },

  /**
   * Handle the list-emojis command
   * @param {Object} params - Command parameters
   * @param {Function} params.respond - Function to respond to the command
   */
  async listEmojis({ respond }) {
    const emojiMap = emojiStorage.load();

    if (Object.keys(emojiMap).length === 0) {
      await respond('🙈 No emoji mappings are currently set.');
      logger.info('List-emojis command executed - no mappings found');
      return;
    }

    const formatted = Object.entries(emojiMap)
      .map(([userId, emoji]) => `• <@${userId}> → ${emoji}`)
      .join('\n');

    await respond(`🗂️ *Emoji Mappings:*\n${formatted}`);
    logger.info(`List-emojis command executed - found ${Object.keys(emojiMap).length} mappings`);
  },

  /**
   * Handle the set-emoji command
   * @param {Object} params - Command parameters
   * @param {Array} params.args - Command arguments
   * @param {Object} params.command - Slack command object
   * @param {Function} params.respond - Function to respond to the command
   * @param {Object} params.client - Slack client
   */
  async setEmoji({ args, command, respond, client }) {
    let userId;
    let emoji;

    if (args.length === 1) {
      userId = command.user_id;
      emoji = args[0];
    } else if (args.length === 2) {
      const userMention = args[0];
      emoji = args[1];

      userId = await findUserId(userMention, client);

      if (!userId) {
        await respond('❌ Could not find user. Mention them properly or use their exact Slack @name.');
        logger.warn(`Set-emoji failed - user not found: ${userMention}`);
        return;
      }
    } else {
      await respond('Usage: `/reserve set-emoji :emoji:` or `/reserve set-emoji @user :emoji:`');
      logger.warn('Set-emoji failed - incorrect usage');
      return;
    }

    if (!isValidEmoji(emoji)) {
      await respond('❌ Invalid emoji format. Please use a valid Slack emoji like `:smile:`.');
      logger.warn(`Set-emoji failed - invalid emoji format: ${emoji}`);
      return;
    }

    const emojiMap = emojiStorage.load();
    emojiMap[userId] = emoji;

    if (emojiStorage.save(emojiMap)) {
      await respond(`Mapped <@${userId}> to ${emoji}`);
      logger.info(`Set-emoji successful - mapped user ${userId} to ${emoji}`);
    } else {
      await respond('❌ Failed to save emoji mapping. Please try again later.');
      logger.error('Set-emoji failed - could not save emoji map');
    }
  },

  /**
   * Handle the release command
   * @param {Object} params - Command parameters
   * @param {Array} params.args - Command arguments
   * @param {Function} params.respond - Function to respond to the command
   * @param {Object} params.client - Slack client
   */
  async release({ args, respond, client }) {
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
  },

  /**
   * Handle the reserve command (default)
   * @param {Object} params - Command parameters
   * @param {string} params.server - Server to reserve
   * @param {Object} params.command - Slack command object
   * @param {Function} params.respond - Function to respond to the command
   * @param {Object} params.client - Slack client
   */
  async reserve({ server, command, respond, client }) {
    const userId = command.user_id;
    const emojiMap = emojiStorage.load();
    const emoji = emojiMap[userId];

    if (!server) {
      await respond('Usage: `/reserve <server>` — but first set your emoji using `/reserve set-emoji :emoji:`');
      logger.warn('Reserve command failed - no server specified');
      return;
    }

    if (!isValidServer(server)) {
      await respond(`❌ Invalid server name: ${server}. Server names should be in the format 'int1', 'int2', etc.`);
      logger.warn(`Reserve command failed - invalid server name: ${server}`);
      return;
    }

    if (!emoji) {
      await respond('You need to set your emoji first using `/reserve set-emoji :emoji:`');
      logger.warn(`Reserve command failed - no emoji set for user ${userId}`);
      return;
    }

    try {
      const result = await client.conversations.info({ channel: STAGING_CHANNEL });
      const originalText = result.channel.topic.value || '';
      const regex = PATTERNS.FREE_SERVER(server);

      if (!regex.test(originalText)) {
        await respond(`Server ${server} is already reserved.`);
        logger.info(`Reserve command - server ${server} already reserved`);
        return;
      }

      const updatedText = originalText.replace(regex, `${server}: ${emoji}`);

      await client.conversations.setTopic({
        channel: STAGING_CHANNEL,
        topic: updatedText
      });

      await respond(`Server ${server} has been reserved with ${emoji}`);
      logger.info(`Reserve command successful - reserved ${server} with ${emoji}`);
    } catch (error) {
      logger.error(`Failed to reserve server ${server}`, error);
      await respond({
        text: `Error: ${error.message || 'Something went wrong.'}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `❌ *Error:* Could not reserve server ${server}. ${error.message || ''}`
            }
          }
        ]
      });
    }
  }
};

app.error((error) => {
  logger.error('Unhandled error in Slack app', error);
});

// Register the /reserve command
app.command('/reserve', async ({ command, ack, respond, client }) => {
  await ack();
  logger.info(`Received command: /reserve ${command.text}`, { user: command.user_id });

  const [subcommand, ...args] = command.text.trim().split(/\s+/);

  // Handle different subcommands
  switch (subcommand) {
    case 'status':
      await commandHandlers.status({ respond, client });
      break;

    case 'list-emojis':
      await commandHandlers.listEmojis({ respond });
      break;

    case 'set-emoji':
      await commandHandlers.setEmoji({ args, command, respond, client });
      break;

    case 'release':
      await commandHandlers.release({ args, respond, client });
      break;

    case 'help':
      await respond(
        '*Available Commands:*\n' +
        '• `/reserve int1` - Reserve a server\n' +
        '• `/reserve release int1` - Release a server\n' +
        '• `/reserve status` - Show current reservations\n' +
        '• `/reserve set-emoji :emoji:` - Set your emoji\n' +
        '• `/reserve set-emoji @user :emoji:` - Set someone else\'s emoji\n' +
        '• `/reserve list-emojis` - List all emoji mappings\n' +
        '• `/reserve help` - Show this help message'
      );
      logger.info('Help command executed');
      break;

    default:
      // Default case: assume it's a reservation request
      await commandHandlers.reserve({
        server: subcommand?.toLowerCase(),
        command,
        respond,
        client
      });
  }
});

(async () => {
  try {
    await app.start(PORT);
    logger.info(`Slack staging reservation bot is running on port ${PORT}!`);

    // Join channel by default. This avoids having to add the bot to the channel.
    const join = await app.client.conversations.join({ channel: STAGING_CHANNEL });

    if (join.already_in_channel) {
      logger.info('Bot is already in the staging channel.');
    } else {
      logger.info('Bot joined the staging channel.');
    }
  } catch (error) {
    logger.error('Startup failure', error);
    process.exit(1);
  }
})();
