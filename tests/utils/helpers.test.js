const helpers = require('../../src/utils/helpers');

describe('Helpers', () => {
  describe('parseServerStatus', () => {
    test('should return empty arrays for empty topic', () => {
      const result = helpers.parseServerStatus('');
      expect(result).toEqual({ reserved: [], available: [], firstline: null });
    });

    test('should parse available servers correctly', () => {
      const topic = 'int1: :free: int2: :free:';
      const result = helpers.parseServerStatus(topic);
      expect(result.available).toEqual(['int1', 'int2']);
      expect(result.reserved).toEqual([]);
    });

    test('should parse reserved servers correctly', () => {
      const topic = 'int1: :smile: int2: :thumbsup:';
      const result = helpers.parseServerStatus(topic);
      expect(result.reserved).toEqual([
        { server: 'int1', emoji: ':smile:', emojiName: 'smile' },
        { server: 'int2', emoji: ':thumbsup:', emojiName: 'thumbsup' }
      ]);
      expect(result.available).toEqual([]);
    });

    test('should parse mixed server status correctly', () => {
      const topic = 'int1: :smile: int2: :free: int3: :thumbsup:';
      const result = helpers.parseServerStatus(topic);
      expect(result.reserved).toEqual([
        { server: 'int1', emoji: ':smile:', emojiName: 'smile' },
        { server: 'int3', emoji: ':thumbsup:', emojiName: 'thumbsup' }
      ]);
      expect(result.available).toEqual(['int2']);
    });

    test('should parse firstline with "firstline:" format', () => {
      const topic = 'int1: :free: firstline: :smile:';
      const result = helpers.parseServerStatus(topic);
      expect(result.firstline).toBe('smile');
    });

    test('should parse firstline with "first line:" format', () => {
      const topic = 'int1: :free: first line: :smile:';
      const result = helpers.parseServerStatus(topic);
      expect(result.firstline).toBe('smile');
    });

    test('should handle complex topic with servers and firstline', () => {
      const topic = 'int1: :smile: int2: :free: int3: :thumbsup: first line: :star:';
      const result = helpers.parseServerStatus(topic);
      expect(result.reserved).toEqual([
        { server: 'int1', emoji: ':smile:', emojiName: 'smile' },
        { server: 'int3', emoji: ':thumbsup:', emojiName: 'thumbsup' }
      ]);
      expect(result.available).toEqual(['int2']);
      expect(result.firstline).toBe('star');
    });
  });

  describe('formatServerStatus', () => {
    test('should format empty status correctly', () => {
      const status = { reserved: [], available: [], firstline: null };
      const result = helpers.formatServerStatus(status);
      expect(result).toContain('*Available*: None');
      expect(result).toContain('*Reserved*: None');
      expect(result).not.toContain('*Firstline*');
    });

    test('should format available servers correctly', () => {
      const status = { reserved: [], available: ['int1', 'int2'], firstline: null };
      const result = helpers.formatServerStatus(status);
      expect(result).toContain('*Available*: int1, int2');
      expect(result).toContain('*Reserved*: None');
    });

    test('should format reserved servers correctly', () => {
      const status = {
        reserved: [
          { server: 'int1', emoji: ':smile:', emojiName: 'smile' },
          { server: 'int2', emoji: ':thumbsup:', emojiName: 'thumbsup' }
        ],
        available: [],
        firstline: null
      };
      const result = helpers.formatServerStatus(status);
      expect(result).toContain('*Available*: None');
      expect(result).toContain('*Reserved*: int1 (:smile:), int2 (:thumbsup:)');
    });

    test('should include firstline when present', () => {
      const status = { reserved: [], available: [], firstline: 'star' };
      const result = helpers.formatServerStatus(status);
      expect(result).toContain('*Firstline*: :star:');
    });
  });

  describe('updateFirstlineInTopic', () => {
    test('should add firstline to empty topic', () => {
      const result = helpers.updateFirstlineInTopic('', 'user1', ':smile:');
      expect(result).toBe('first line: :smile:');
    });

    test('should replace existing firstline with new one', () => {
      const result = helpers.updateFirstlineInTopic('firstline: :star:', 'user1', ':smile:');
      expect(result).toBe('first line: :smile:');
    });

    test('should replace "first line:" format with new firstline', () => {
      const result = helpers.updateFirstlineInTopic('first line: :star:', 'user1', ':smile:');
      expect(result).toBe('first line: :smile:');
    });

    test('should add firstline to topic with servers', () => {
      const result = helpers.updateFirstlineInTopic('int1: :free: int2: :free:', 'user1', ':smile:');
      expect(result).toBe('int1: :free: int2: :free: first line: :smile:');
    });

    test('should replace firstline in topic with servers', () => {
      const result = helpers.updateFirstlineInTopic('int1: :free: firstline: :star:', 'user1', ':smile:');
      expect(result).toBe('int1: :free: first line: :smile:');
    });

    test('should remove firstline when user and emoji are null', () => {
      const result = helpers.updateFirstlineInTopic('int1: :free: firstline: :star:', null, null);
      expect(result).toBe('int1: :free:');
    });
  });
});
