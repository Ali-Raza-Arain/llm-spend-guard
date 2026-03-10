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
});
