import { ChatMessage } from './types';
import { estimateTokens, extractText } from './token-estimator';

/**
 * Truncates messages to fit within a token budget.
 * Strategy: keep system message + last N messages that fit.
 * Older messages are dropped first; the last user message is never dropped.
 */
export function truncateMessages(
  messages: ChatMessage[],
  maxTokens: number,
  model: string,
): ChatMessage[] {
  if (messages.length === 0) return messages;

  const overhead = 7; // message framing tokens
  let budget = maxTokens - overhead;
  if (budget <= 0) return [messages[messages.length - 1]];

  // Separate system messages (always keep) from conversation
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

  // Reserve budget for system messages
  for (const msg of systemMsgs) {
    budget -= estimateTokens(extractText(msg), model) + 4;
  }

  if (budget <= 0) {
    // Even system messages exceed budget — truncate the system message text
    return systemMsgs.map((m) => ({
      ...m,
      content: truncateText(extractText(m), maxTokens - overhead, model),
    }));
  }

  // Build from the end (most recent messages first)
  const kept: ChatMessage[] = [];
  for (let i = nonSystemMsgs.length - 1; i >= 0; i--) {
    const msg = nonSystemMsgs[i];
    const cost = estimateTokens(extractText(msg), model) + 4;
    if (cost <= budget) {
      kept.unshift(msg);
      budget -= cost;
    } else if (kept.length === 0) {
      // Last message doesn't fit — truncate it
      kept.unshift({
        ...msg,
        content: truncateText(extractText(msg), budget - 4, model),
      });
      break;
    } else {
      break;
    }
  }

  return [...systemMsgs, ...kept];
}

function truncateText(text: string, maxTokens: number, model: string): string {
  if (maxTokens <= 0) return '';
  // Binary search for the right length
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (estimateTokens(text.slice(0, mid), model) <= maxTokens) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  const truncated = text.slice(0, lo);
  return truncated.length < text.length ? truncated + '...' : truncated;
}
