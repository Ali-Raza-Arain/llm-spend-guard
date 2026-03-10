import { LLMGuard } from 'llm-spend-guard';
import Anthropic from '@anthropic-ai/sdk';

async function main() {
  const guard = new LLMGuard({
    userBudgetTokens: 10_000,    // 10k tokens per user
    dailyBudgetTokens: 1_000_000, // 1M tokens global daily
    autoTruncate: true,
    onBudgetWarning(level, stats) {
      if (stats.scope === 'user') {
        console.log(`User ${stats.scopeKey} hit ${level}: ${stats.percentage.toFixed(0)}% used`);
      }
    },
  });

  const anthropic = new Anthropic();
  guard.wrapAnthropic(anthropic);

  // Simulate requests from different users
  for (const userId of ['user-1', 'user-2', 'user-3']) {
    try {
      const response = await guard.anthropic.chat(
        {
          model: 'claude-sonnet-4-20250514',
          messages: [{ role: 'user', content: 'Explain quantum computing in 100 words.' }],
          max_tokens: 200,
        },
        { userId },
      );
      console.log(`${userId}:`, response.content[0].text);
    } catch (err: any) {
      console.error(`${userId}: ${err.message}`);
    }
  }
}

main().catch(console.error);
