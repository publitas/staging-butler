/**
 * Cache utility for reducing API calls and rate limiting
 */
const logger = require('./logger');

// Cache storage with TTL
const cacheStore = {
  // Structure: { key: { data: any, timestamp: number } }
};

// Default TTL values (in milliseconds)
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
const CHANNEL_TOPIC_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEYS = {
  USERS_LIST: 'users_list',
  CHANNEL_TOPIC: 'channel_topic'
};

/**
 * Get an item from cache if it exists and is not expired
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {any|null} Cached data or null if not found/expired
 */
function get(key, ttl = DEFAULT_TTL) {
  const cacheEntry = cacheStore[key];
  
  if (!cacheEntry) {
    logger.debug(`Cache miss: ${key} (not in cache)`);
    return null;
  }
  
  const now = Date.now();
  const isExpired = now - cacheEntry.timestamp > ttl;
  
  if (isExpired) {
    logger.debug(`Cache miss: ${key} (expired, age: ${(now - cacheEntry.timestamp) / 1000}s)`);
    return null;
  }
  
  logger.debug(`Cache hit: ${key} (age: ${(now - cacheEntry.timestamp) / 1000}s)`);
  return cacheEntry.data;
}

/**
 * Set an item in the cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @returns {void}
 */
function set(key, data) {
  cacheStore[key] = {
    data,
    timestamp: Date.now()
  };
  logger.debug(`Cache set: ${key}`);
}

/**
 * Invalidate a cache entry
 * @param {string} key - Cache key to invalidate
 * @returns {boolean} True if an entry was invalidated
 */
function invalidate(key) {
  if (cacheStore[key]) {
    delete cacheStore[key];
    logger.debug(`Cache invalidated: ${key}`);
    return true;
  }
  return false;
}

/**
 * Get users list from cache or fetch from Slack API
 * @param {Object} client - Slack client
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<Object>} Users list
 */
async function getUsersList(client, ttl = DEFAULT_TTL) {
  // Try to get from cache first
  const cachedUsers = get(CACHE_KEYS.USERS_LIST, ttl);
  if (cachedUsers) {
    return cachedUsers;
  }
  
  // Not in cache or expired, fetch from API
  try {
    logger.info('Fetching users list from Slack API');
    const usersList = await client.users.list();
    
    // Cache the result
    set(CACHE_KEYS.USERS_LIST, usersList);
    
    return usersList;
  } catch (error) {
    // If we hit a rate limit, log it but don't cache the error
    if (error.code === 'slack_webapi_platform_error' && 
        error.data && error.data.error === 'ratelimited') {
      logger.warn(`Rate limited when fetching users list. Retry after: ${error.data.retry_after || 'unknown'} seconds`);
    } else {
      logger.error('Error fetching users list', error);
    }
    throw error;
  }
}

/**
 * Get channel topic from cache or fetch from Slack API
 * @param {Object} client - Slack client
 * @param {string} channelId - Channel ID
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<Object>} Channel info result
 */
async function getChannelInfo(client, channelId, ttl = CHANNEL_TOPIC_TTL) {
  const cacheKey = `${CACHE_KEYS.CHANNEL_TOPIC}_${channelId}`;
  
  // Try to get from cache first
  const cachedInfo = get(cacheKey, ttl);
  if (cachedInfo) {
    return cachedInfo;
  }
  
  // Not in cache or expired, fetch from API
  try {
    logger.info(`Fetching channel info for ${channelId} from Slack API`);
    const result = await client.conversations.info({ channel: channelId });
    
    // Cache the result
    set(cacheKey, result);
    
    return result;
  } catch (error) {
    // If we hit a rate limit, log it but don't cache the error
    if (error.code === 'slack_webapi_platform_error' && 
        error.data && error.data.error === 'ratelimited') {
      logger.warn(`Rate limited when fetching channel info. Retry after: ${error.data.retry_after || 'unknown'} seconds`);
    } else {
      logger.error(`Error fetching channel info for ${channelId}`, error);
    }
    throw error;
  }
}

/**
 * Invalidate channel topic cache after topic is updated
 * @param {string} channelId - Channel ID
 */
function invalidateChannelInfo(channelId) {
  const cacheKey = `${CACHE_KEYS.CHANNEL_TOPIC}_${channelId}`;
  return invalidate(cacheKey);
}

module.exports = {
  get,
  set,
  invalidate,
  getUsersList,
  getChannelInfo,
  invalidateChannelInfo,
  CACHE_KEYS
};
