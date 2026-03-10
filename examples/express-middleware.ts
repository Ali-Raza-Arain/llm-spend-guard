import express from 'express';
import OpenAI from 'openai';
import { LLMGuard, expressMiddleware, budgetErrorHandler } from 'llm-spend-guard';

const app = express();
app.use(express.json());

const guard = new LLMGuard({
  dailyBudgetTokens: 500_000,
  userBudgetTokens: 50_000,
  maxTokensPerRequest: 10_000,
  onBudgetWarning(level, stats) {
    console.warn(`[Budget ${level}]`, stats.scopeKey, `${stats.percentage.toFixed(1)}%`);
  },
});

const openai = new OpenAI();
guard.wrapOpenAI(openai);

// Attach guard context to every request
app.use(expressMiddleware(guard));

app.post('/api/chat', async (req, res, next) => {
  try {
    const response = await guard.openai.chat(
      {
        model: 'gpt-4o',
        messages: req.body.messages,
        max_tokens: 1000,
      },
      req.llmBudgetContext, // automatically populated by middleware
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Handle budget exceeded as 429
app.use(budgetErrorHandler);

app.listen(3000, () => console.log('Server running on :3000'));
