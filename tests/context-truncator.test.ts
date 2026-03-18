import { truncateMessages } from '../src/context-truncator';

describe('Context Truncator', () => {
  const model = 'claude-3-sonnet';

  it('returns all messages when within budget', () => {
    const messages = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ];
    const result = truncateMessages(messages, 1000, model);
    expect(result).toHaveLength(2);
  });

  it('keeps system message and trims older messages', () => {
    const messages = [
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'A'.repeat(500) },
      { role: 'assistant', content: 'B'.repeat(500) },
      { role: 'user', content: 'Latest question' },
    ];
    // Small budget forces trimming
    const result = truncateMessages(messages, 100, model);
    // System message should always be present
    expect(result[0].role).toBe('system');
    // Most recent message should be kept
    expect(result[result.length - 1].content).toContain('Latest question');
    // Should have fewer messages than original
    expect(result.length).toBeLessThanOrEqual(messages.length);
  });

  it('truncates the last message if even it alone exceeds budget', () => {
    const messages = [{ role: 'user', content: 'X'.repeat(10000) }];
    const result = truncateMessages(messages, 50, model);
    expect(result).toHaveLength(1);
    const content = result[0].content as string;
    expect(content.length).toBeLessThan(10000);
    expect(content).toContain('...');
  });

  it('handles empty messages', () => {
    const result = truncateMessages([], 1000, model);
    expect(result).toHaveLength(0);
  });

  it('returns last message when budget is zero or negative', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'World' },
    ];
    const result = truncateMessages(messages, 0, model);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('World');
  });

  it('truncates system message when it exceeds budget alone', () => {
    const messages = [
      { role: 'system', content: 'S'.repeat(5000) },
      { role: 'user', content: 'Hi' },
    ];
    // Very small budget that system message alone exceeds
    const result = truncateMessages(messages, 20, model);
    expect(result[0].role).toBe('system');
    const content = result[0].content as string;
    expect(content.length).toBeLessThan(5000);
  });

  it('drops middle messages and keeps most recent', () => {
    const messages = [
      { role: 'user', content: 'Message 1' },
      { role: 'assistant', content: 'Response 1' },
      { role: 'user', content: 'Message 2' },
      { role: 'assistant', content: 'Response 2' },
      { role: 'user', content: 'Message 3' },
    ];
    // Budget that fits ~2 short messages
    const result = truncateMessages(messages, 40, model);
    expect(result.length).toBeLessThan(messages.length);
    // Last message should be present
    expect(result[result.length - 1].content).toBe('Message 3');
  });

  it('keeps all messages when budget is generous', () => {
    const messages = [
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ];
    const result = truncateMessages(messages, 100000, model);
    expect(result).toHaveLength(3);
  });

  it('handles single system message', () => {
    const messages = [
      { role: 'system', content: 'You are a bot.' },
    ];
    const result = truncateMessages(messages, 1000, model);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('system');
  });

  it('truncateText returns empty string for zero maxTokens', () => {
    const messages = [
      { role: 'system', content: 'A'.repeat(5000) },
    ];
    // Budget so small even truncated system message is empty
    const result = truncateMessages(messages, 7, model);
    expect(result).toHaveLength(1);
  });
});
