const statusCommand = require('./status');
const listEmojisCommand = require('./listEmojis');
const setEmojiCommand = require('./setEmoji');
const releaseCommand = require('./release');
const reserveCommand = require('./reserve');
const helpCommand = require('./help');
const firstlineCommand = require('./firstline');

/**
 * Command handlers for the Staging Butler app
 */
const commandHandlers = {
  status: statusCommand,
  listEmojis: listEmojisCommand,
  setEmoji: setEmojiCommand,
  release: releaseCommand,
  reserve: reserveCommand,
  help: helpCommand,
  firstline: firstlineCommand
};

module.exports = commandHandlers;
