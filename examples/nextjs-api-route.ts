import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { LLMGuard, withBudgetGuard } from 'llm-spend-guard';

const guard = new LLMGuard({
  dailyBudgetTokens: 200_000,
  userBudgetTokens: 20_000,
  autoTruncate: true,
});

const openai = new OpenAI();
guard.wrapOpenAI(openai);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await guard.openai.chat(
    {
      model: 'gpt-4o',
      messages: req.body.messages,
      max_tokens: 1000,
    },
    req.llmBudgetContext,
  );
  res.status(200).json(response);
}

export default withBudgetGuard(guard, handler);
