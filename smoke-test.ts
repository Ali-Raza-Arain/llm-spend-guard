import { LLMGuard, BudgetExceededError } from './src';

async function main() {
  const guard = new LLMGuard({
    dailyBudgetTokens: 1000,
    maxTokensPerRequest: 500,
    autoTruncate: true,
    onBudgetWarning(level, stats) {
      console.log(`⚠ Alert [${level}]: ${stats.scopeKey} at ${stats.percentage.toFixed(1)}%`);
    },
  });

  // Mock OpenAI client
  const mockOpenAI = {
    chat: {
      completions: {
        create: async (params: any) => ({
          choices: [{ message: { content: 'Mock response' } }],
          usage: { prompt_tokens: 30, completion_tokens: 50 },
        }),
      },
    },
  };

  guard.wrapOpenAI(mockOpenAI);

  // Request 1 — should succeed
  console.log('--- Request 1 ---');
  const res1 = await guard.openai.chat({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello world' }],
    max_tokens: 100,
  });
  console.log('Response:', res1.choices[0].message.content);

  // Check stats
  const stats = await guard.getStats();
  console.log('Stats:', stats);

  // Request 2 — should succeed but trigger 50% warning
  console.log('\n--- Request 2 ---');
  await guard.openai.chat({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Tell me a joke' }],
    max_tokens: 400,
  });

  // Request 3 — should exceed budget
  console.log('\n--- Request 3 (should fail) ---');
  try {
    await guard.openai.chat({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Another question' }],
      max_tokens: 900,
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      console.log('Blocked:', err.message);
      console.log('Details:', err.stats);
    }
  }

  console.log('\nFinal remaining budget:', await guard.getRemainingBudget());
  console.log('\nAll checks passed!');
}

main().catch(console.error);
