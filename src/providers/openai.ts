import { BudgetManager } from '../budget-manager';
import { estimateMessagesTokens } from '../token-estimator';
import { truncateMessages } from '../context-truncator';
import { RequestContext, ChatMessage } from '../types';

export class OpenAIProvider {
  private client: any;
  private budgetManager: BudgetManager;
  private autoTruncate: boolean;

  constructor(client: any, budgetManager: BudgetManager, autoTruncate = false) {
    this.client = client;
    this.budgetManager = budgetManager;
    this.autoTruncate = autoTruncate;
  }

  async chat(
    params: {
      model: string;
      messages: ChatMessage[];
      max_tokens?: number;
      [key: string]: unknown;
    },
    ctx: RequestContext = {},
  ): Promise<any> {
    let { messages } = params;
    const maxOutput = params.max_tokens ?? 4096;
    let estimatedInput = estimateMessagesTokens(messages, params.model);
    const estimatedTotal = estimatedInput + maxOutput;

    if (this.autoTruncate) {
      const remaining = await this.budgetManager.getRemainingBudget(ctx);
      if (remaining < Infinity) {
        const inputBudget = remaining - maxOutput;
        if (inputBudget > 0 && estimatedInput > inputBudget) {
          messages = truncateMessages(messages, inputBudget, params.model);
          estimatedInput = estimateMessagesTokens(messages, params.model);
        }
      }
    }

    await this.budgetManager.checkBudget(estimatedInput + maxOutput, ctx);

    const response = await this.client.chat.completions.create({
      ...params,
      messages,
    });

    const usage = response.usage;
    if (usage) {
      const totalTokens = (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0);
      await this.budgetManager.recordUsage(totalTokens, ctx);
    } else {
      await this.budgetManager.recordUsage(estimatedTotal, ctx);
    }

    return response;
  }
}
