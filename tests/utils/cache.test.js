const cache = require('../../src/utils/cache');

// Mock the logger to prevent console output during tests
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Helper function to clear the cache store
function clearCacheStore() {
  // Get all keys in the cache and invalidate them
  Object.keys(cache).forEach(key => {
    if (typeof cache[key] === 'function' && key === 'invalidate') {
      // We can't directly access the cache store, but we can invalidate known keys
      cache.invalidate('test-key');
      cache.invalidate(cache.CACHE_KEYS.USERS_LIST);
      cache.invalidate(`${cache.CACHE_KEYS.CHANNEL_TOPIC}_C123`);
    }
  });
}

describe('Cache Utility', () => {
  beforeEach(() => {
    clearCacheStore();
    jest.clearAllMocks();
  });

  describe('get and set operations', () => {
    test('should return null for non-existent cache key', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('should store and retrieve a value', () => {
      const testData = { test: 'data' };
      cache.set('test-key', testData);
      const result = cache.get('test-key');
      expect(result).toEqual(testData);
    });

    test('should return null for expired cache entry', () => {
      const testData = { test: 'data' };
      cache.set('test-key', testData);
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 60001); // Add 60+ seconds
      
      const result = cache.get('test-key', 60000); // 60 second TTL
      expect(result).toBeNull();
      
      // Restore original Date.now
      Date.now = originalNow;
    });

    test('should return cached value for non-expired entry', () => {
      const testData = { test: 'data' };
      cache.set('test-key', testData);
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 30000); // Add 30 seconds
      
      const result = cache.get('test-key', 60000); // 60 second TTL
      expect(result).toEqual(testData);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('getUsersList', () => {
    test('should cache and return users list', async () => {
      const mockClient = {
        users: {
          list: jest.fn().mockResolvedValue({ members: [{ id: 'U123', name: 'testuser' }] })
        }
      };

      const result = await cache.getUsersList(mockClient);
      expect(result).toEqual({ members: [{ id: 'U123', name: 'testuser' }] });
      expect(mockClient.users.list).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const cachedResult = await cache.getUsersList(mockClient);
      expect(cachedResult).toEqual({ members: [{ id: 'U123', name: 'testuser' }] });
      expect(mockClient.users.list).toHaveBeenCalledTimes(1); // Still called only once
    });
  });

  describe('getChannelInfo and invalidateChannelInfo', () => {
    test('should cache channel info and invalidate it properly', async () => {
      // Create a mock client
      const mockClient = {
        conversations: {
          info: jest.fn().mockResolvedValue({ 
            channel: { id: 'C123', name: 'test-channel', topic: { value: 'Test Topic' } }
          })
        }
      };

      // First call should hit the API
      const result1 = await cache.getChannelInfo(mockClient, 'C123');
      expect(result1).toEqual({ 
        channel: { id: 'C123', name: 'test-channel', topic: { value: 'Test Topic' } }
      });
      expect(mockClient.conversations.info).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await cache.getChannelInfo(mockClient, 'C123');
      expect(result2).toEqual({ 
        channel: { id: 'C123', name: 'test-channel', topic: { value: 'Test Topic' } }
      });
      expect(mockClient.conversations.info).toHaveBeenCalledTimes(1); // Still called only once

      // Invalidate the cache
      cache.invalidateChannelInfo('C123');

      // Third call should hit the API again
      const result3 = await cache.getChannelInfo(mockClient, 'C123');
      expect(result3).toEqual({ 
        channel: { id: 'C123', name: 'test-channel', topic: { value: 'Test Topic' } }
      });
      expect(mockClient.conversations.info).toHaveBeenCalledTimes(2); // Called again after invalidation
    });
  });
});
