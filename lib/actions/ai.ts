"use server";

import { auth } from "@/auth";
import { salesRepository } from "@/lib/repositories/sales";
import { getNotesForPeriod } from "@/lib/domain/sales-log";
import { parseEntryFromText, type ParsedEntry } from "@/lib/ai/entry-agent";
import { generateText } from "ai";
import { getAIConfig } from "@/lib/ai/provider";
import { NOTES_SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { decrypt } from "@/lib/utils/encryption";
import prisma from "@/lib/prisma";
export async function parseEntryAction(
  text: string,
  currentEntry?: ParsedEntry,
  pendingQ?: string | null
): Promise<{ data?: ParsedEntry; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    if (!text || text.trim().length === 0) {
      return { error: "Missing or invalid text input." };
    }

    const recentSales = await salesRepository.getRecentSales(userId, 10);
    const defaultSplit = session.user.default_split_percentage ?? 60;
    const parsedEntry = await parseEntryFromText(userId, text.trim(), recentSales, defaultSplit, currentEntry, pendingQ);

    return { data: parsedEntry };
  } catch (error) {
    console.error("Entry agent action error:", error);
    return { error: "An error occurred while parsing your entry." };
  }
}

export async function summarizeNotesAction(year: string, month: string): Promise<{ data?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    
    const userId = session.user.id;

    const startDate = new Date(parseInt(year), parseInt(month), 1);
    const endDate = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59, 999);
    const allSales = await salesRepository.getSalesByDateRange(userId, startDate, endDate);
    const targetSales = getNotesForPeriod(allSales);

    if (targetSales.length === 0) {
      return { data: "No notable events or notes were recorded for this period." };
    }

    const formattedNotes = targetSales.map(s => {
      return `Date: ${s.date.toLocaleDateString("en-PH")}\nNotes: ${s.notes}`;
    }).join("\n\n");

    const { provider, modelId } = await getAIConfig(userId);

    const { text } = await generateText({
      model: provider.chat(modelId),
      system: NOTES_SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Please summarize the following notes for the month:\n\n${formattedNotes}` }],
    });

    return { data: text };

  } catch (error) {
    console.error("Summarization action error:", error);
    return { error: "An error occurred while generating the summary." };
  }
}

export async function testAiConnectionAction(testKey?: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    let keyToTest = testKey;

    if (!keyToTest || keyToTest.includes('••••')) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { openrouterKey: true }
      });
      if (!user?.openrouterKey) {
        return { success: false, error: "No API key found to test." };
      }
      keyToTest = decrypt(user.openrouterKey);
    }

    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${keyToTest}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, data: data.data?.label || "Active" };
    } else {
      return { success: false, error: "Connection failed. Invalid API key." };
    }
  } catch (error) {
    console.error("Test connection error:", error);
    return { success: false, error: "Connection failed. Check your network." };
  }
}

