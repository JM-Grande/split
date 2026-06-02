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
          return { success: false, error: "Invalid email or password." };
        case "AccessDenied":
          return { success: false, error: "Email needs to be verified." };
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
  const email = formData.get("email") as string;
  const password = formData.get("password");

  const validatedFields = registerSchema.safeParse({
    name,
    email,
    password,
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

  const { name: validName, email: validEmail, password: validPassword } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({
    where: { email: validEmail },
  });

  if (existingUser) {
    return { success: false, error: "Email already exists." };
  }

  const hashedPassword = await bcrypt.hash(validPassword, 12);

  await prisma.user.create({
    data: {
      name: validName,
      email: validEmail,
      password: hashedPassword,
      emailVerified: new Date(),
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
    
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    const validatedFields = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
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

    const { currentPassword: curPass, newPassword: newPass } = validatedFields.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const passwordMatch = await bcrypt.compare(curPass, user.password);

    if (!passwordMatch) {
      return { success: false, error: "Incorrect current password." };
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteAccountAction(
  prevState: unknown,
  formData: FormData
) {
  try {
    const userId = await requireAuth();

    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    const validatedFields = deleteAccountSchema.safeParse({ password, confirmPassword });

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

    const passwordMatch = await bcrypt.compare(validatedFields.data.password, user.password);

    if (!passwordMatch) {
      return { success: false, error: "Incorrect password." };
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
  const email = formData.get("email") as string;
  const recoveryKey = formData.get("recoveryKey") as string;

  const validatedFields = forgotPasswordSchema.safeParse({ email, recoveryKey });

  if (!validatedFields.success) {
    return { success: false, error: "Invalid email or recovery key." };
  }

  const { email: validEmail, recoveryKey: validKey } = validatedFields.data;

  const user = await prisma.user.findUnique({
    where: { email: validEmail },
  });

  if (!user || !user.recoveryKey) {
    return { success: false, error: "Invalid email or recovery key." };
  }

  const keyMatch = await bcrypt.compare(validKey, user.recoveryKey);
  if (!keyMatch) {
    return { success: false, error: "Invalid email or recovery key." };
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Clean up any existing reset tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email: validEmail },
  });

  await prisma.passwordResetToken.create({
    data: {
      email: validEmail,
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
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  const validatedFields = resetPasswordSchema.safeParse({
    token,
    newPassword,
    confirmPassword,
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

  const { token: validToken, newPassword: validNewPassword } = validatedFields.data;

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
    where: { email: resetTokenRecord.email },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  const hashedPassword = await bcrypt.hash(validNewPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.delete({
      where: { id: resetTokenRecord.id },
    }),
  ]);

  return { success: true, message: "Password reset successfully." };
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