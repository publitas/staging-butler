const logger = require('../utils/logger');

/**
 * Handle the help command
 * @param {Object} params - Command parameters
 * @param {Function} params.respond - Function to respond to the command
 */
async function helpCommand({ respond }) {
  await respond(
    '*Available Commands:*\n' +
    '• `/reserve int1` - Reserve a server\n' +
    '• `/reserve release int1` - Release a server\n' +
    '• `/reserve status` - Show current reservations\n' +
    '• `/reserve set-emoji :emoji:` - Set your emoji\n' +
    '• `/reserve set-emoji @user :emoji:` - Set someone else\'s emoji\n' +
    '• `/reserve list-emojis` - List all emoji mappings\n' +
    '• `/reserve firstline` - Show current firstline person\n' +
    '• `/reserve firstline @user` - Set firstline person\n' +
    '• `/reserve help` - Show this help message'
  );
  logger.info('Help command executed');
}

module.exports = helpCommand;
