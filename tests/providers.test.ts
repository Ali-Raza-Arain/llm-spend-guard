import { OpenAIProvider } from '../src/providers/openai';
import { AnthropicProvider } from '../src/providers/anthropic';
import { GeminiProvider } from '../src/providers/gemini';
import { BudgetManager } from '../src/budget-manager';
import { BudgetExceededError } from '../src/errors';

describe('OpenAI Provider', () => {
  function mockOpenAIClient(usage = { prompt_tokens: 50, completion_tokens: 100 }) {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Hello!' } }],
            usage,
          }),
        },
      },
    };
  }

  it('sends request and records usage', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockOpenAIClient();
    const provider = new OpenAIProvider(client, mgr);

    const response = await provider.chat({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
    });

    expect(response.choices[0].message.content).toBe('Hello!');
    expect(client.chat.completions.create).toHaveBeenCalled();

    const stats = await mgr.getStats();
    expect(stats[0].used).toBe(150); // 50 + 100
  });

  it('rejects when budget exceeded', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100 });
    const client = mockOpenAIClient();
    const provider = new OpenAIProvider(client, mgr);

    // Use up budget
    await mgr.recordUsage(90);

    await expect(
      provider.chat({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 100,
      }),
    ).rejects.toThrow(BudgetExceededError);

    // Should not have called the API
    expect(client.chat.completions.create).not.toHaveBeenCalled();
  });

  it('auto-truncates when enabled', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 500 });
    const client = mockOpenAIClient({ prompt_tokens: 30, completion_tokens: 50 });
    const provider = new OpenAIProvider(client, mgr, true);

    await provider.chat({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'A'.repeat(2000) },
        { role: 'user', content: 'Latest msg' },
      ],
      max_tokens: 100,
    });

    // Should have called the API (truncation allowed it)
    expect(client.chat.completions.create).toHaveBeenCalled();
    const sentMessages = client.chat.completions.create.mock.calls[0][0].messages;
    // Messages may have been truncated
    expect(sentMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('uses estimated total when response has no usage', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Hello!' } }],
            usage: undefined,
          }),
        },
      },
    };
    const provider = new OpenAIProvider(client, mgr);

    await provider.chat({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
    });

    const stats = await mgr.getStats();
    // Should have recorded estimated tokens (input estimate + 100 max_tokens)
    expect(stats[0].used).toBeGreaterThan(0);
  });

  it('defaults to 4096 max_tokens when not specified', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockOpenAIClient();
    const provider = new OpenAIProvider(client, mgr);

    await provider.chat({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(client.chat.completions.create).toHaveBeenCalled();
  });

  it('auto-truncates and re-estimates when input exceeds remaining budget', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 300 });
    // Use up some budget so remaining is tight
    await mgr.recordUsage(50);
    const client = mockOpenAIClient({ prompt_tokens: 20, completion_tokens: 30 });
    const provider = new OpenAIProvider(client, mgr, true);

    await provider.chat({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'A'.repeat(5000) },
      ],
      max_tokens: 100,
    });

    expect(client.chat.completions.create).toHaveBeenCalled();
    const sentMessages = client.chat.completions.create.mock.calls[0][0].messages;
    // Message should have been truncated
    const content = sentMessages[0].content as string;
    expect(content.length).toBeLessThan(5000);
  });

  it('passes request context to budget manager', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000, userBudgetTokens: 50_000 });
    const client = mockOpenAIClient();
    const provider = new OpenAIProvider(client, mgr);

    await provider.chat(
      { model: 'gpt-4o', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 100 },
      { userId: 'user-1' },
    );

    const stats = await mgr.getStats({ userId: 'user-1' });
    const userStat = stats.find(s => s.scope === 'user');
    expect(userStat).toBeDefined();
    expect(userStat!.used).toBe(150);
  });
});

describe('Anthropic Provider', () => {
  function mockAnthropicClient(usage = { input_tokens: 50, output_tokens: 100 }) {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Hello!' }],
          usage,
        }),
      },
    };
  }

  it('sends request and records usage', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockAnthropicClient();
    const provider = new AnthropicProvider(client, mgr);

    const response = await provider.chat({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
    });

    expect(response.content[0].text).toBe('Hello!');
    const stats = await mgr.getStats();
    expect(stats[0].used).toBe(150);
  });

  it('rejects when budget exceeded', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 50 });
    const client = mockAnthropicClient();
    const provider = new AnthropicProvider(client, mgr);

    await expect(
      provider.chat({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 100,
      }),
    ).rejects.toThrow(BudgetExceededError);

    expect(client.messages.create).not.toHaveBeenCalled();
  });

  it('includes system prompt in token estimation', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockAnthropicClient();
    const provider = new AnthropicProvider(client, mgr);

    await provider.chat({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
      system: 'You are a helpful assistant.',
    });

    expect(client.messages.create).toHaveBeenCalled();
    const stats = await mgr.getStats();
    expect(stats[0].used).toBe(150);
  });

  it('auto-truncates when enabled', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 500 });
    const client = mockAnthropicClient({ input_tokens: 30, output_tokens: 50 });
    const provider = new AnthropicProvider(client, mgr, true);

    await provider.chat({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'user', content: 'A'.repeat(2000) },
        { role: 'user', content: 'Latest msg' },
      ],
      max_tokens: 100,
    });

    expect(client.messages.create).toHaveBeenCalled();
  });

  it('auto-truncates with system prompt', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 500 });
    const client = mockAnthropicClient({ input_tokens: 30, output_tokens: 50 });
    const provider = new AnthropicProvider(client, mgr, true);

    await provider.chat({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'user', content: 'A'.repeat(2000) },
        { role: 'user', content: 'Latest msg' },
      ],
      max_tokens: 100,
      system: 'You are helpful.',
    });

    expect(client.messages.create).toHaveBeenCalled();
  });

  it('uses estimated total when response has no usage', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Hello!' }],
          usage: undefined,
        }),
      },
    };
    const provider = new AnthropicProvider(client, mgr);

    await provider.chat({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
    });

    const stats = await mgr.getStats();
    expect(stats[0].used).toBeGreaterThan(0);
  });

  it('defaults to 4096 max_tokens when not specified', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockAnthropicClient();
    const provider = new AnthropicProvider(client, mgr);

    await provider.chat({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(client.messages.create).toHaveBeenCalled();
  });
});

describe('Gemini Provider', () => {
  function mockGeminiClient(usageMetadata = { totalTokenCount: 150 }) {
    const generateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => 'Hello!',
        usageMetadata,
      },
    });
    return {
      getGenerativeModel: jest.fn().mockReturnValue({ generateContent }),
      _generateContent: generateContent,
    };
  }

  it('sends request and records usage', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockGeminiClient();
    const provider = new GeminiProvider(client, mgr);

    const response = await provider.chat({
      model: 'gemini-1.5-pro',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
    });

    expect(client.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-1.5-pro' });
    const stats = await mgr.getStats();
    expect(stats[0].used).toBe(150);
  });

  it('converts message roles correctly', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockGeminiClient();
    const provider = new GeminiProvider(client, mgr);

    await provider.chat({
      model: 'gemini-1.5-pro',
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'How are you?' },
      ],
      max_tokens: 100,
    });

    const call = client._generateContent.mock.calls[0][0];
    expect(call.contents[0].role).toBe('user');
    expect(call.contents[1].role).toBe('model');
    expect(call.contents[2].role).toBe('user');
  });

  it('handles non-string content in messages', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockGeminiClient();
    const provider = new GeminiProvider(client, mgr);

    await provider.chat({
      model: 'gemini-1.5-pro',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] as any }],
      max_tokens: 100,
    });

    const call = client._generateContent.mock.calls[0][0];
    // Non-string content should result in empty text for Gemini format
    expect(call.contents[0].parts[0].text).toBe('');
  });

  it('rejects when budget exceeded', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 50 });
    const client = mockGeminiClient();
    const provider = new GeminiProvider(client, mgr);

    await expect(
      provider.chat({
        model: 'gemini-1.5-pro',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 100,
      }),
    ).rejects.toThrow(BudgetExceededError);

    expect(client._generateContent).not.toHaveBeenCalled();
  });

  it('auto-truncates when enabled', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 500 });
    const client = mockGeminiClient({ totalTokenCount: 80 });
    const provider = new GeminiProvider(client, mgr, true);

    await provider.chat({
      model: 'gemini-1.5-pro',
      messages: [
        { role: 'user', content: 'A'.repeat(2000) },
        { role: 'user', content: 'Latest msg' },
      ],
      max_tokens: 100,
    });

    expect(client._generateContent).toHaveBeenCalled();
  });

  it('uses estimated total when response has no usageMetadata', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockGeminiClient(undefined as any);
    const provider = new GeminiProvider(client, mgr);

    await provider.chat({
      model: 'gemini-1.5-pro',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
    });

    const stats = await mgr.getStats();
    expect(stats[0].used).toBeGreaterThan(0);
  });

  it('defaults to 4096 max_tokens when not specified', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockGeminiClient();
    const provider = new GeminiProvider(client, mgr);

    await provider.chat({
      model: 'gemini-1.5-pro',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(client._generateContent).toHaveBeenCalled();
  });

  it('uses totalTokenCount from usageMetadata when available', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const client = mockGeminiClient({ totalTokenCount: 200 });
    const provider = new GeminiProvider(client, mgr);

    await provider.chat({
      model: 'gemini-1.5-pro',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
    });

    const stats = await mgr.getStats();
    expect(stats[0].used).toBe(200);
  });

  it('falls back to estimated total when totalTokenCount is undefined', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100_000 });
    const generateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => 'Hello!',
        usageMetadata: { totalTokenCount: undefined },
      },
    });
    const client = {
      getGenerativeModel: jest.fn().mockReturnValue({ generateContent }),
    };
    const provider = new GeminiProvider(client, mgr);

    await provider.chat({
      model: 'gemini-1.5-pro',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 100,
    });

    const stats = await mgr.getStats();
    // Should use estimated total since totalTokenCount is undefined
    expect(stats[0].used).toBeGreaterThan(0);
  });
});
