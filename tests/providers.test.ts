import { OpenAIProvider } from '../src/providers/openai';
import { AnthropicProvider } from '../src/providers/anthropic';
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
});
