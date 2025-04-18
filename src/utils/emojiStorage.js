const fs = require('fs');
const { EMOJI_MAP_PATH } = require('../config');
const logger = require('./logger');

/**
 * Emoji storage utility for managing user emojis
 */
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

module.exports = emojiStorage;
