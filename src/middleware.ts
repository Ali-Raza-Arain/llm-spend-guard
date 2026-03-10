import { LLMGuard } from './guard';
import { BudgetExceededError } from './errors';

/**
 * Express middleware that attaches budget context from request.
 * Extracts userId, sessionId, and route automatically.
 */
export function expressMiddleware(guard: LLMGuard) {
  return (req: any, res: any, next: any) => {
    req.llmGuard = guard;
    req.llmBudgetContext = {
      userId: req.headers['x-user-id'] ?? req.user?.id,
      sessionId: req.headers['x-session-id'] ?? req.sessionID,
      route: req.path,
    };
    next();
  };
}

/**
 * Express error handler for BudgetExceededError.
 */
export function budgetErrorHandler(err: any, _req: any, res: any, next: any) {
  if (err instanceof BudgetExceededError) {
    res.status(429).json({
      error: 'Token budget exceeded',
      details: err.stats,
    });
    return;
  }
  next(err);
}

/**
 * Next.js API route wrapper that enforces budget.
 */
export function withBudgetGuard(guard: LLMGuard, handler: (req: any, res: any) => Promise<any>) {
  return async (req: any, res: any) => {
    req.llmGuard = guard;
    req.llmBudgetContext = {
      userId: req.headers['x-user-id'],
      sessionId: req.headers['x-session-id'],
      route: req.url,
    };
    try {
      return await handler(req, res);
    } catch (err) {
      if (err instanceof BudgetExceededError) {
        return res.status(429).json({
          error: 'Token budget exceeded',
          details: (err as BudgetExceededError).stats,
        });
      }
      throw err;
    }
  };
}
