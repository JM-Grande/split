import { createOpenAI } from "@ai-sdk/openai";
import prisma from "@/lib/prisma";

import { decrypt } from "@/lib/utils/encryption";

export async function getAIConfig(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openrouterKey: true, aiModel: true }
  });

  if (!user || !user.openrouterKey) {
    throw new Error("Missing OpenRouter API Key. Please configure it in Settings.");
  }

  const decryptedKey = decrypt(user.openrouterKey);

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: decryptedKey,
    fetch: async (url, options) => {
      // Intercept the request to OpenRouter to forcefully enable reasoning
      if (options && options.body) {
        try {
          const body = JSON.parse(options.body.toString());
          body.reasoning = { enabled: true };
          options.body = JSON.stringify(body);
        } catch (e) {
          console.error("Failed to inject reasoning:", e);
        }
      }
      return fetch(url, options);
    }
  });

  return {
    provider: openrouter,
    modelId: user.aiModel || "deepseek/deepseek-v4-flash"
  };
}
