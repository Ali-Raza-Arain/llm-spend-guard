export type Provider = 'openai' | 'anthropic' | 'gemini';

export type BudgetScope = 'global' | 'user' | 'session' | 'route';

export type AlertLevel = 'warning_50' | 'warning_80' | 'exceeded';

export interface BudgetConfig {
  /** Max tokens per single request (input + estimated output) */
  maxTokensPerRequest?: number;
  /** Max tokens per session */
  sessionBudgetTokens?: number;
  /** Max tokens per day */
  dailyBudgetTokens?: number;
  /** Max tokens per user */
  userBudgetTokens?: number;
  /** Global token budget (across all scopes) */
  globalBudgetTokens?: number;
}

export interface GuardConfig extends BudgetConfig {
  /** Storage backend. Defaults to in-memory */
  storage?: StorageAdapter;
  /** Enable automatic prompt truncation when over budget */
  autoTruncate?: boolean;
  /** Alert callback */
  onBudgetWarning?: (level: AlertLevel, stats: BudgetStats) => void;
  /** Custom token estimator override */
  tokenEstimator?: TokenEstimatorFn;
}

export interface BudgetStats {
  scope: BudgetScope;
  scopeKey: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

export interface UsageRecord {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: number;
}

export interface ScopeUsage {
  totalTokens: number;
  /** ISO date string for daily reset */
  date: string;
}

export interface StorageAdapter {
  get(key: string): Promise<ScopeUsage | null>;
  set(key: string, value: ScopeUsage): Promise<void>;
  increment(key: string, tokens: number): Promise<ScopeUsage>;
  reset(key: string): Promise<void>;
}

export type TokenEstimatorFn = (text: string, model: string) => number;

export interface RequestContext {
  userId?: string;
  sessionId?: string;
  route?: string;
}

export interface ChatMessage {
  role: string;
  content: string | Array<{ type: string; text?: string; [k: string]: unknown }>;
}

export interface ProviderRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

export interface ProviderResponse {
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    totalTokenCount?: number;
  };
  [key: string]: unknown;
}
