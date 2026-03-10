import { ChatMessage, TokenEstimatorFn } from './types';

/**
 * Estimates token count for a string.
 * Uses tiktoken for OpenAI models when available, falls back to heuristic.
 */
let tiktokenEncoding: any = null;

function getTiktokenEncoder(): any {
  if (tiktokenEncoding) return tiktokenEncoding;
  try {
    const tiktoken = require('tiktoken');
    tiktokenEncoding = tiktoken.encoding_for_model('gpt-4o');
    return tiktokenEncoding;
  } catch {
    return null;
  }
}

function estimateWithTiktoken(text: string): number {
  const enc = getTiktokenEncoder();
  if (!enc) return heuristicEstimate(text);
  try {
    const tokens = enc.encode(text);
    return tokens.length;
  } catch {
    return heuristicEstimate(text);
  }
}

/**
 * Heuristic: ~4 characters per token for English text.
 * Slightly conservative to avoid underestimation.
 */
function heuristicEstimate(text: string): number {
  return Math.ceil(text.length / 3.5);
}

function isOpenAIModel(model: string): boolean {
  return /^(gpt-|o1|o3|o4|chatgpt|ft:gpt)/.test(model);
}

export function estimateTokens(text: string, model: string): number {
  if (isOpenAIModel(model)) {
    return estimateWithTiktoken(text);
  }
  return heuristicEstimate(text);
}

export function extractText(message: ChatMessage): string {
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .filter((p) => p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text!)
      .join('\n');
  }
  return '';
}

export function estimateMessagesTokens(messages: ChatMessage[], model: string): number {
  let total = 0;
  for (const msg of messages) {
    // Each message has ~4 tokens overhead (role, delimiters)
    total += 4;
    total += estimateTokens(extractText(msg), model);
  }
  // Every reply is primed with assistant prefix
  total += 3;
  return total;
}

export function createEstimator(customFn?: TokenEstimatorFn): (text: string, model: string) => number {
  return customFn ?? estimateTokens;
}
