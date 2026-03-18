import { expressMiddleware, budgetErrorHandler, withBudgetGuard } from '../src/middleware';
import { LLMGuard } from '../src/guard';
import { BudgetExceededError } from '../src/errors';

describe('expressMiddleware', () => {
  it('attaches guard and budget context to request', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const middleware = expressMiddleware(guard);

    const req: any = {
      headers: { 'x-user-id': 'user-1', 'x-session-id': 'sess-1' },
      path: '/api/chat',
    };
    const res: any = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.llmGuard).toBe(guard);
    expect(req.llmBudgetContext).toEqual({
      userId: 'user-1',
      sessionId: 'sess-1',
      route: '/api/chat',
    });
    expect(next).toHaveBeenCalled();
  });

  it('extracts userId from req.user.id when header is missing', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const middleware = expressMiddleware(guard);

    const req: any = {
      headers: {},
      user: { id: 'passport-user' },
      sessionID: 'express-sess',
      path: '/api/ask',
    };
    const res: any = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.llmBudgetContext.userId).toBe('passport-user');
    expect(req.llmBudgetContext.sessionId).toBe('express-sess');
    expect(req.llmBudgetContext.route).toBe('/api/ask');
  });
});

describe('budgetErrorHandler', () => {
  it('returns 429 for BudgetExceededError', () => {
    const stats = {
      scope: 'global' as const,
      scopeKey: 'daily',
      used: 10000,
      limit: 10000,
      remaining: 0,
      percentage: 100,
    };
    const err = new BudgetExceededError(stats);

    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    budgetErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token budget exceeded',
      details: stats,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes non-budget errors to next', () => {
    const err = new Error('Something else');
    const req: any = {};
    const res: any = {};
    const next = jest.fn();

    budgetErrorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('withBudgetGuard', () => {
  it('attaches context and calls handler', async () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });

    const handler = jest.fn().mockResolvedValue('ok');
    const wrapped = withBudgetGuard(guard, handler);

    const req: any = {
      headers: { 'x-user-id': 'u1', 'x-session-id': 's1' },
      url: '/api/chat',
    };
    const res: any = {};

    const result = await wrapped(req, res);

    expect(req.llmGuard).toBe(guard);
    expect(req.llmBudgetContext).toEqual({
      userId: 'u1',
      sessionId: 's1',
      route: '/api/chat',
    });
    expect(handler).toHaveBeenCalledWith(req, res);
    expect(result).toBe('ok');
  });

  it('returns 429 when handler throws BudgetExceededError', async () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const stats = {
      scope: 'user' as const,
      scopeKey: 'user:u1',
      used: 10000,
      limit: 10000,
      remaining: 0,
      percentage: 100,
    };

    const handler = jest.fn().mockRejectedValue(new BudgetExceededError(stats));
    const wrapped = withBudgetGuard(guard, handler);

    const req: any = { headers: {}, url: '/api/chat' };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token budget exceeded',
      details: stats,
    });
  });

  it('re-throws non-budget errors', async () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const handler = jest.fn().mockRejectedValue(new Error('Network error'));
    const wrapped = withBudgetGuard(guard, handler);

    const req: any = { headers: {}, url: '/api/chat' };
    const res: any = {};

    await expect(wrapped(req, res)).rejects.toThrow('Network error');
  });
});
