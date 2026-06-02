import { streamText } from "ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { auth } from "@/auth";
import { salesRepository } from "@/lib/repositories/sales";
import { mapUIMessagesToOpenAI } from "@/lib/utils/chat";
import { getAIConfig } from "@/lib/ai/provider";

export const maxDuration = 60; // Max execution time increased for reasoning

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    const { messages } = await req.json();

    // Convert frontend UIMessage format to OpenAI format
    const coreMessages = mapUIMessagesToOpenAI(messages);

    // Fetch the most recent 12 weeks of sales unconditionally
    // We slice the data to avoid unbounded system prompt scaling 
    // We avoid Vercel AI SDK 'tools' because OpenRouter's reasoning models frequently reject them with 400 errors
    const allSales = await salesRepository.getAllSales(userId);
    const recentSales = allSales.slice(0, 12);

    // Use streamText for perfect Vercel AI SDK frontend compatibility
    const { provider, modelId } = await getAIConfig(userId);

    const result = streamText({
      model: provider.chat(modelId),
      system: `${CHAT_SYSTEM_PROMPT}\n\nHere is the user's most recent 12 weeks of sales data:\n${JSON.stringify(recentSales, null, 2)}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: coreMessages as any,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    
    // Check if this is an AI SDK API Call Error
    const err = error as Error & { statusCode?: number };
    if (err.name === 'AI_APICallError' || err.name === 'APICallError') {
      return new Response(err.message || "AI Provider Error", { 
        status: err.statusCode || 400 
      });
    }

    return new Response("An error occurred during chat processing.", { status: 500 });
  }
}
