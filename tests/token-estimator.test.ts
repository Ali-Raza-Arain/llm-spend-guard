import { estimateTokens, estimateMessagesTokens } from '../src/token-estimator';

describe('Token Estimator', () => {
  it('estimates tokens for short text', () => {
    const tokens = estimateTokens('Hello world', 'claude-3-sonnet');
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(20);
  });

  it('estimates tokens for longer text', () => {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(100);
    const tokens = estimateTokens(text, 'claude-3-sonnet');
    expect(tokens).toBeGreaterThan(100);
    expect(tokens).toBeLessThan(2000);
  });

  it('estimates empty text as zero or near-zero', () => {
    const tokens = estimateTokens('', 'gpt-4o');
    expect(tokens).toBeLessThanOrEqual(1);
  });

  it('estimates messages tokens including overhead', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hi' },
    ];
    const tokens = estimateMessagesTokens(messages, 'claude-3-sonnet');
    // Should be text tokens + overhead (4 per msg + 3 priming)
    expect(tokens).toBeGreaterThan(10);
    expect(tokens).toBeLessThan(50);
  });

  it('handles multipart content', () => {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image' },
          { type: 'image_url', url: 'http://example.com/img.png' },
        ],
      },
    ];
    const tokens = estimateMessagesTokens(messages, 'gpt-4o');
    expect(tokens).toBeGreaterThan(5);
  });
});
