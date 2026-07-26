"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { registerSchema, changePasswordSchema, deleteAccountSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/schemas/auth";


export async function loginAction(
  prevState: unknown,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid PIN." };
        default:
          return { success: false, error: "Something went wrong." };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut();
}

/**
 * Standard security helper to ensure a user is authenticated in Server Actions.
 * Throws an error if no session exists, or returns the authenticated user's ID.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }
  return session.user.id;
}

export async function registerAction(
  prevState: unknown,
  formData: FormData
) {
  const name = formData.get("name");
  const pin = formData.get("pin");
  const confirmPin = formData.get("confirmPin");

  const validatedFields = registerSchema.safeParse({
    name,
    pin,
    confirmPin,
  });

  if (!validatedFields.success) {
    const details = validatedFields.error.issues.reduce((acc, issue) => {
      const key = issue.path[0] as string;
      if (key) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(issue.message);
      }
      return acc;
    }, {} as Record<string, string[]>);

    return { 
      success: false,
      error: "Invalid fields.", 
      details 
    };
  }

  const { name: validName, pin: validPin } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({
    where: { name: validName },
  });

  if (existingUser) {
    return { success: false, error: "User already exists with this name." };
  }

  const hashedPassword = await bcrypt.hash(validPin, 12);

  await prisma.user.create({
    data: {
      name: validName,
      password: hashedPassword,
    },
  });

  return { success: true, message: "Registration successful." };
}

export async function changePasswordAction(
  prevState: unknown,
  formData: FormData
) {
  try {
    const userId = await requireAuth();
    
    const currentPin = formData.get("currentPin");
    const newPin = formData.get("newPin");
    const confirmPin = formData.get("confirmPin");

    const validatedFields = changePasswordSchema.safeParse({
      currentPin,
      newPin,
      confirmPin,
    });

    if (!validatedFields.success) {
      const details = validatedFields.error.issues.reduce((acc, issue) => {
        const key = issue.path[0] as string;
        if (key) {
          if (!acc[key]) acc[key] = [];
          acc[key].push(issue.message);
        }
        return acc;
      }, {} as Record<string, string[]>);

      return { 
        success: false,
        error: "Invalid fields.", 
        details 
      };
    }

    const { currentPin: curPin, newPin: freshPin } = validatedFields.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const passwordMatch = await bcrypt.compare(curPin, user.password);

    if (!passwordMatch) {
      return { success: false, error: "Incorrect current PIN." };
    }

    const hashedPassword = await bcrypt.hash(freshPin, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: "PIN updated successfully." };
  } catch (error) {
    console.error("Change PIN error:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteAccountAction(
  prevState: unknown,
  formData: FormData
) {
  try {
    const userId = await requireAuth();

    const pin = formData.get("pin");
    const confirmPin = formData.get("confirmPin");

    const validatedFields = deleteAccountSchema.safeParse({ pin, confirmPin });

    if (!validatedFields.success) {
      const details = validatedFields.error.issues.reduce((acc, issue) => {
        const key = issue.path[0] as string;
        if (key) {
          if (!acc[key]) acc[key] = [];
          acc[key].push(issue.message);
        }
        return acc;
      }, {} as Record<string, string[]>);

      return { 
        success: false,
        error: "Invalid fields.", 
        details 
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const passwordMatch = await bcrypt.compare(validatedFields.data.pin, user.password);

    if (!passwordMatch) {
      return { success: false, error: "Incorrect PIN." };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

  } catch (error) {
    if (error instanceof AuthError) {
        throw error;
    }
    console.error("Delete account error:", error);
    return { success: false, error: "Something went wrong." };
  }

  await signOut();
}

export async function forgotPasswordAction(
  prevState: unknown,
  formData: FormData
) {
  const name = formData.get("name") as string | null;
  const recoveryKey = formData.get("recoveryKey") as string;

  const validatedFields = forgotPasswordSchema.safeParse({ name: name || undefined, recoveryKey });

  if (!validatedFields.success) {
    return { success: false, error: "Invalid recovery key." };
  }

  const { name: validName, recoveryKey: validKey } = validatedFields.data;

  let targetUser = null;
  if (validName) {
    targetUser = await prisma.user.findUnique({
      where: { name: validName },
    });
    if (targetUser && targetUser.recoveryKey) {
      const match = await bcrypt.compare(validKey, targetUser.recoveryKey);
      if (!match) targetUser = null;
    } else {
      targetUser = null;
    }
  } else {
    const users = await prisma.user.findMany({ where: { NOT: { recoveryKey: null } } });
    for (const u of users) {
      if (u.recoveryKey && (await bcrypt.compare(validKey, u.recoveryKey))) {
        targetUser = u;
        break;
      }
    }
  }

  if (!targetUser) {
    return { success: false, error: "Invalid recovery key." };
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Clean up any existing reset tokens for this user name
  await prisma.passwordResetToken.deleteMany({
    where: { name: targetUser.name },
  });

  await prisma.passwordResetToken.create({
    data: {
      name: targetUser.name,
      token,
      expires,
    },
  });

  return { 
    success: true,
    resetLink: `/reset-password?token=${token}`,
    message: "Recovery key verified.",
  };
}

export async function resetPasswordAction(
  prevState: unknown,
  formData: FormData
) {
  const token = formData.get("token");
  const newPin = formData.get("newPin");
  const confirmPin = formData.get("confirmPin");

  const validatedFields = resetPasswordSchema.safeParse({
    token,
    newPin,
    confirmPin,
  });

  if (!validatedFields.success) {
    const details = validatedFields.error.issues.reduce((acc, issue) => {
      const key = issue.path[0] as string;
      if (key) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(issue.message);
      }
      return acc;
    }, {} as Record<string, string[]>);

    return { 
      success: false,
      error: "Invalid fields.", 
      details 
    };
  }

  const { token: validToken, newPin: validNewPin } = validatedFields.data;

  const resetTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token: validToken },
  });

  if (!resetTokenRecord) {
    return { success: false, error: "Invalid token." };
  }

  if (resetTokenRecord.expires < new Date()) {
    await prisma.passwordResetToken.delete({
      where: { id: resetTokenRecord.id },
    });
    return { success: false, error: "Token has expired." };
  }

  const user = await prisma.user.findUnique({
    where: { name: resetTokenRecord.name },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  const hashedPassword = await bcrypt.hash(validNewPin, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.delete({
      where: { id: resetTokenRecord.id },
    }),
  ]);

  return { success: true, message: "PIN reset successfully." };
}

export async function generateRecoveryKeyAction() {
  try {
    const userId = await requireAuth();

    const rawRecoveryKey = crypto.randomBytes(8).toString('hex').match(/.{1,4}/g)?.join('-').toUpperCase() || "SPLT-AAAA-BBBB-CCCC";
    const hashedRecoveryKey = await bcrypt.hash(rawRecoveryKey, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { recoveryKey: hashedRecoveryKey },
    });

    return { success: true, recoveryKey: rawRecoveryKey };
  } catch (error) {
    console.error("Generate recovery key error:", error);
    return { success: false, error: "Something went wrong." };
  }
}