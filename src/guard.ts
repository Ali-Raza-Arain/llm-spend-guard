import { GuardConfig, RequestContext, BudgetStats } from './types';
import { BudgetManager } from './budget-manager';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GeminiProvider } from './providers/gemini';
import { MemoryStorage } from './storage/memory';

export class LLMGuard {
  private budgetManager: BudgetManager;
  private config: GuardConfig;
  private _openai?: OpenAIProvider;
  private _anthropic?: AnthropicProvider;
  private _gemini?: GeminiProvider;

  constructor(config: GuardConfig) {
    this.config = config;
    const storage = config.storage ?? new MemoryStorage();
    this.budgetManager = new BudgetManager(config, storage, config.onBudgetWarning);
  }

  /** Wrap an OpenAI client instance */
  wrapOpenAI(client: any): OpenAIProvider {
    this._openai = new OpenAIProvider(client, this.budgetManager, this.config.autoTruncate);
    return this._openai;
  }

  /** Wrap an Anthropic client instance */
  wrapAnthropic(client: any): AnthropicProvider {
    this._anthropic = new AnthropicProvider(client, this.budgetManager, this.config.autoTruncate);
    return this._anthropic;
  }

  /** Wrap a Google Generative AI client instance */
  wrapGemini(client: any): GeminiProvider {
    this._gemini = new GeminiProvider(client, this.budgetManager, this.config.autoTruncate);
    return this._gemini;
  }

  /** Access wrapped OpenAI provider */
  get openai(): OpenAIProvider {
    if (!this._openai) throw new Error('OpenAI not configured. Call guard.wrapOpenAI(client) first.');
    return this._openai;
  }

  /** Access wrapped Anthropic provider */
  get anthropic(): AnthropicProvider {
    if (!this._anthropic) throw new Error('Anthropic not configured. Call guard.wrapAnthropic(client) first.');
    return this._anthropic;
  }

  /** Access wrapped Gemini provider */
  get gemini(): GeminiProvider {
    if (!this._gemini) throw new Error('Gemini not configured. Call guard.wrapGemini(client) first.');
    return this._gemini;
  }

  /** Get budget stats for a context */
  async getStats(ctx?: RequestContext): Promise<BudgetStats[]> {
    return this.budgetManager.getStats(ctx);
  }

  /** Get remaining token budget */
  async getRemainingBudget(ctx?: RequestContext): Promise<number> {
    return this.budgetManager.getRemainingBudget(ctx);
  }

  /** Reset budgets */
  async reset(ctx?: RequestContext): Promise<void> {
    return this.budgetManager.reset(ctx);
  }

  /** Get the underlying budget manager */
  getBudgetManager(): BudgetManager {
    return this.budgetManager;
  }
}
