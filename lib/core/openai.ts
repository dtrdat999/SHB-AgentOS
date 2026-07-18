// ============================================================
// SHB-AgentOS: OpenAI Client Wrapper
// Centralized OpenAI SDK setup for agent reasoning + tool calling
// ============================================================

import OpenAI from 'openai';

// ============================================================
// Singleton OpenAI client
// ============================================================
let _openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment variables.');
    }
    _openaiClient = new OpenAI({ apiKey });
  }
  return _openaiClient;
}

// ============================================================
// Default model configuration
// ============================================================
export function getModelName(): string {
  return process.env.OPENAI_MODEL || 'gpt-4.1-nano';
}

// ============================================================
// Chat completion wrapper with tool calling support
// ============================================================
export interface ChatCompletionOptions {
  systemPrompt: string;
  userMessage: string;
  tools?: OpenAI.ChatCompletionTool[];
  temperature?: number;
  maxTokens?: number;
}

export async function chatCompletion(options: ChatCompletionOptions) {
  const client = getOpenAIClient();
  const model = getModelName();

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: options.systemPrompt },
    { role: 'user', content: options.userMessage },
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    tools: options.tools,
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens ?? 2048,
  });

  return response;
}

// ============================================================
// Agent conversation with multi-turn tool calling
// Handles the tool call → result → continue loop
// ============================================================
export interface AgentConversationOptions {
  systemPrompt: string;
  userMessage: string;
  tools: OpenAI.ChatCompletionTool[];
  toolExecutor: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  maxIterations?: number;
  temperature?: number;
}

export async function runAgentConversation(options: AgentConversationOptions) {
  const client = getOpenAIClient();
  const model = getModelName();
  const maxIterations = options.maxIterations ?? 10;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: options.systemPrompt },
    { role: 'user', content: options.userMessage },
  ];

  const toolCallLog: Array<{
    tool_name: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }> = [];

  for (let i = 0; i < maxIterations; i++) {
    const response = await client.chat.completions.create({
      model,
      messages,
      tools: options.tools,
      temperature: options.temperature ?? 0,
    });

    const choice = response.choices[0];

    // If no tool calls, agent is done reasoning
    if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
      return {
        finalResponse: choice.message.content,
        toolCallLog,
        usage: response.usage,
      };
    }

    // Process tool calls
    messages.push(choice.message);

    for (const toolCall of choice.message.tool_calls) {
      if (toolCall.type !== 'function') continue;
      const fn = toolCall.function;
      const args = JSON.parse(fn.arguments);
      const result = await options.toolExecutor(fn.name, args);

      toolCallLog.push({
        tool_name: fn.name,
        arguments: args,
        result,
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Max iterations reached
  return {
    finalResponse: 'Agent reached maximum iterations without completing.',
    toolCallLog,
    usage: null,
  };
}
