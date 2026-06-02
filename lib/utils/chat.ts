type CoreMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string };

export interface UIMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content?: string;
  text?: string;
  parts?: { type: string; text?: string }[];
  reasoning_details?: unknown;
  toolInvocations?: unknown[];
}

export function mapUIMessagesToOpenAI(messages: UIMessage[]): CoreMessage[] {
  return messages.map((msg) => {
    let content = msg.content || '';
    if (msg.parts && Array.isArray(msg.parts)) {
      content = msg.parts.map((p) => p.text || '').join('\n');
    }
    
    let safeRole = msg.role;
    if (safeRole !== 'user' && safeRole !== 'assistant') {
      safeRole = 'user'; // Prevent system prompt injection from frontend
    }
    
    // Convert to strict CoreMessage format without unknown properties
    return {
      role: safeRole,
      content
    } as CoreMessage;
  });
}
