import { estimateTokens, estimateMessagesTokens, extractText, createEstimator } from '../src/token-estimator';

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

  it('uses tiktoken for OpenAI models', () => {
    const tokens = estimateTokens('Hello world', 'gpt-4o');
    expect(tokens).toBeGreaterThan(0);
  });

  it('uses heuristic for non-OpenAI models', () => {
    const tokens = estimateTokens('Hello world', 'claude-3-sonnet');
    expect(tokens).toBeGreaterThan(0);
  });

  it('recognizes various OpenAI model patterns', () => {
    const models = ['gpt-4o', 'gpt-3.5-turbo', 'o1', 'o3', 'o4', 'chatgpt-4o', 'ft:gpt-4'];
    for (const model of models) {
      const tokens = estimateTokens('Hello', model);
      expect(tokens).toBeGreaterThan(0);
    }
  });

  it('uses heuristic for Anthropic and Gemini models', () => {
    const models = ['claude-sonnet-4-20250514', 'gemini-1.5-pro', 'mistral-large'];
    for (const model of models) {
      const tokens = estimateTokens('Hello world test', model);
      expect(tokens).toBeGreaterThan(0);
    }
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

describe('extractText', () => {
  it('extracts string content', () => {
    expect(extractText({ role: 'user', content: 'Hello' })).toBe('Hello');
  });

  it('extracts text from multipart array', () => {
    const msg = {
      role: 'user',
      content: [
        { type: 'text', text: 'Part 1' },
        { type: 'image_url', url: 'http://example.com' },
        { type: 'text', text: 'Part 2' },
      ],
    };
    expect(extractText(msg)).toBe('Part 1\nPart 2');
  });

  it('returns empty string for non-string non-array content', () => {
    const msg = { role: 'user', content: 123 as any };
    expect(extractText(msg)).toBe('');
  });

  it('handles empty array content', () => {
    const msg = { role: 'user', content: [] };
    expect(extractText(msg)).toBe('');
  });

  it('filters out non-text parts', () => {
    const msg = {
      role: 'user',
      content: [
        { type: 'image_url', url: 'http://example.com' },
      ],
    };
    expect(extractText(msg)).toBe('');
  });
});

describe('createEstimator', () => {
  it('returns default estimateTokens when no custom fn provided', () => {
    const estimator = createEstimator();
    const tokens = estimator('Hello world', 'gpt-4o');
    expect(tokens).toBeGreaterThan(0);
  });

  it('returns custom function when provided', () => {
    const customFn = (text: string, _model: string) => text.length;
    const estimator = createEstimator(customFn);
    expect(estimator('Hello', 'gpt-4o')).toBe(5);
  });
});
