"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

const onboardingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  defaultSplitPercentage: z.number().min(1).max(100, "Percentage must be between 1 and 100"),
  openrouterKey: z.string().nullable().optional(),
  aiModel: z.string().default("deepseek/deepseek-v4-flash"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export async function completeOnboardingAction(data: OnboardingInput) {
  try {
    // 1. Ensure onboarding is not run if a user already exists
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return { success: false, error: "Setup has already been completed. Please log in." };
    }

    // 2. Validate input fields
    const validated = onboardingSchema.safeParse(data);
    if (!validated.success) {
      return { 
        success: false, 
        error: "Invalid fields.",
        details: validated.error.flatten().fieldErrors 
      };
    }

    const { name, email, password, defaultSplitPercentage, openrouterKey, aiModel } = validated.data;

    // Double check email uniqueness just in case
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    if (existing) {
      return { success: false, error: "Email is already taken." };
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const rawRecoveryKey = crypto.randomBytes(8).toString('hex').match(/.{1,4}/g)?.join('-').toUpperCase() || "SPLT-AAAA-BBBB-CCCC";
    const hashedRecoveryKey = await bcrypt.hash(rawRecoveryKey, 12);

    // 4. Create first user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        default_split_percentage: defaultSplitPercentage,
        openrouterKey: openrouterKey || null,
        aiModel: aiModel || "deepseek/deepseek-v4-flash",
        emailVerified: new Date(), // Auto-verify email for local usage
        recoveryKey: hashedRecoveryKey,
      }
    });

    return { success: true, recoveryKey: rawRecoveryKey };
  } catch (error) {
    console.error("Onboarding action error:", error);
    return { success: false, error: "Something went wrong during setup." };
  }
}
