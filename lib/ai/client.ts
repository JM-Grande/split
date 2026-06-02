import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.LLM_API_KEY || "test-key-fallback";

/**
 * Shared AI client instance using the AgentRouter API (OpenAI compatible).
 * Used by all Tier 2 AI features.
 */
export const aiClient = createOpenAI({
  name: "agentrouter",
  baseURL: "https://agentrouter.org/v1",
  apiKey,
});

/**
 * The standard model used for the application.
 */
export const STANDARD_MODEL = "deepseek-v4-pro";
