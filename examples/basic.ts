import { LLMGuard } from 'llm-spend-guard';
import OpenAI from 'openai';

async function main() {
  const guard = new LLMGuard({
    dailyBudgetTokens: 100_000,
    maxTokensPerRequest: 10_000,
    autoTruncate: true,
    onBudgetWarning(level, stats) {
      console.log(`[Budget ${level}]`, stats);
    },
  });

  const openai = new OpenAI();
  guard.wrapOpenAI(openai);

  const response = await guard.openai.chat({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'What is the meaning of life?' }],
    max_tokens: 500,
  });

  console.log(response.choices[0].message.content);

  const stats = await guard.getStats();
  console.log('Budget stats:', stats);
}

main().catch(console.error);
