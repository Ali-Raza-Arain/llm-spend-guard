# Next.js API Routes with LLM Token Budget Guard

Protect your Next.js AI endpoints from token overspending with a single wrapper function.

## Setup

```bash
npm install llm-spend-guard openai
```

```typescript
// lib/guard.ts
import { LLMGuard } from 'llm-spend-guard';
import OpenAI from 'openai';

export const guard = new LLMGuard({
  dailyBudgetTokens: 200_000,
  userBudgetTokens: 20_000,
  autoTruncate: true,
});

const openai = new OpenAI();
guard.wrapOpenAI(openai);
```

## Pages Router (pages/api)

```typescript
// pages/api/chat.ts
import { withBudgetGuard } from 'llm-spend-guard';
import { guard } from '../../lib/guard';

async function handler(req: any, res: any) {
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
```

## App Router (app/api)

```typescript
// app/api/chat/route.ts
import { guard } from '../../../lib/guard';
import { BudgetExceededError } from 'llm-spend-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const userId = req.headers.get('x-user-id') || 'anonymous';

  try {
    const response = await guard.openai.chat(
      { model: 'gpt-4o', messages, max_tokens: 1000 },
      { userId },
    );
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json(
        { error: 'Token budget exceeded', details: err.stats },
        { status: 429 },
      );
    }
    throw err;
  }
}
```
