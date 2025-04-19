const validators = require('../../src/utils/validators');
const cache = require('../../src/utils/cache');

// Mock the cache module
jest.mock('../../src/utils/cache', () => ({
  getUsersList: jest.fn()
}));

// Mock the logger to prevent console output during tests
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidServer', () => {
    test('should return true for valid server names', () => {
      expect(validators.isValidServer('int1')).toBe(true);
      expect(validators.isValidServer('int2')).toBe(true);
      expect(validators.isValidServer('int10')).toBe(true);
      expect(validators.isValidServer('INT1')).toBe(true); // Case insensitive
    });

    test('should return false for invalid server names', () => {
      expect(validators.isValidServer('int')).toBe(false);
      expect(validators.isValidServer('int-1')).toBe(false);
      expect(validators.isValidServer('staging1')).toBe(false);
      expect(validators.isValidServer('1int')).toBe(false);
      expect(validators.isValidServer('')).toBe(false);
      expect(validators.isValidServer(null)).toBe(false);
      expect(validators.isValidServer(undefined)).toBe(false);
    });
  });

  describe('isValidEmoji', () => {
    test('should return true for valid emoji format', () => {
      expect(validators.isValidEmoji(':smile:')).toBe(true);
      expect(validators.isValidEmoji(':thumbsup:')).toBe(true);
      expect(validators.isValidEmoji(':custom_emoji:')).toBe(true);
      expect(validators.isValidEmoji(':emoji-with-dash:')).toBe(true);
      expect(validators.isValidEmoji(':emoji_with_underscore:')).toBe(true);
      expect(validators.isValidEmoji(':123:')).toBe(true);
    });

    test('should return false for invalid emoji format', () => {
      expect(validators.isValidEmoji('smile')).toBe(false);
      expect(validators.isValidEmoji(':smile')).toBe(false);
      expect(validators.isValidEmoji('smile:')).toBe(false);
      expect(validators.isValidEmoji('::smile::')).toBe(false);
      expect(validators.isValidEmoji(':smile::')).toBe(false);
      expect(validators.isValidEmoji('::')).toBe(false);
      expect(validators.isValidEmoji('')).toBe(false);
      expect(validators.isValidEmoji(null)).toBe(false);
      expect(validators.isValidEmoji(undefined)).toBe(false);
    });
  });

  describe('findUserId', () => {
    const mockClient = { users: { list: jest.fn() } };
    const mockUsersList = {
      members: [
        { id: 'U123', name: 'user1', real_name: 'User One', profile: { display_name: 'user.one' } },
        { id: 'U456', name: 'user2', real_name: 'User Two', profile: { display_name: 'user.two' } }
      ]
    };

    beforeEach(() => {
      cache.getUsersList.mockResolvedValue(mockUsersList);
    });

    test('should find user by mention format', async () => {
      const userId = await validators.findUserId('<@U123>', mockClient);
      expect(userId).toBe('U123');
      expect(cache.getUsersList).not.toHaveBeenCalled(); // Should not call API for direct mentions
    });

    test('should find user by mention format with username', async () => {
      const userId = await validators.findUserId('<@U456|user2>', mockClient);
      expect(userId).toBe('U456');
      expect(cache.getUsersList).not.toHaveBeenCalled(); // Should not call API for direct mentions
    });

    test('should find user by username', async () => {
      const userId = await validators.findUserId('user1', mockClient);
      expect(userId).toBe('U123');
      expect(cache.getUsersList).toHaveBeenCalledWith(mockClient);
    });

    test('should find user by real name', async () => {
      const userId = await validators.findUserId('User Two', mockClient);
      expect(userId).toBe('U456');
      expect(cache.getUsersList).toHaveBeenCalledWith(mockClient);
    });

    test('should find user by display name', async () => {
      const userId = await validators.findUserId('user.one', mockClient);
      expect(userId).toBe('U123');
      expect(cache.getUsersList).toHaveBeenCalledWith(mockClient);
    });

    test('should return null for non-existent user', async () => {
      const userId = await validators.findUserId('nonexistent', mockClient);
      expect(userId).toBeNull();
      expect(cache.getUsersList).toHaveBeenCalledWith(mockClient);
    });

    test('should return null for empty input', async () => {
      const userId = await validators.findUserId('', mockClient);
      expect(userId).toBeNull();
      expect(cache.getUsersList).not.toHaveBeenCalled();
    });

    test('should return null for null input', async () => {
      const userId = await validators.findUserId(null, mockClient);
      expect(userId).toBeNull();
      expect(cache.getUsersList).not.toHaveBeenCalled();
    });
  });
});
