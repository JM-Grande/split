"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/auth";
import { encrypt } from "@/lib/utils/encryption";

export async function updateDefaultSplitAction(newPercentage: number) {
  try {
    const userId = await requireAuth();

    if (newPercentage < 1 || newPercentage > 100) {
      return { success: false, error: "Percentage must be between 1 and 100." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { default_split_percentage: newPercentage },
    });

    revalidatePath("/profile");
    revalidatePath("/sales");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update default split percentage:", error);
    return { success: false, error: "Failed to save settings." };
  }
}

export async function updateAiSettingsAction(openrouterKey: string | null, aiModel: string) {
  try {
    const userId = await requireAuth();

    let finalKey: string | null | undefined = openrouterKey;
    if (openrouterKey && openrouterKey.includes('••••')) {
      finalKey = undefined; // Do not overwrite with masked key
    }

    const dataToUpdate: { aiModel: string; openrouterKey?: string | null } = {
      aiModel: aiModel || "deepseek/deepseek-v4-flash"
    };

    if (finalKey !== undefined) {
      dataToUpdate.openrouterKey = finalKey ? encrypt(finalKey) : null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    revalidatePath("/profile");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update AI settings:", error);
    return { success: false, error: "Failed to save AI settings." };
  }
}
