import { z } from "zod";

export const pinSchema = z
  .string()
  .regex(/^\d{4}$/, "PIN must be exactly 4 numeric digits");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    pin: pinSchema,
    confirmPin: z.string().min(1, "Please confirm your 4-digit PIN"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export const loginSchema = z.object({
  pin: pinSchema,
});

export const changePasswordSchema = z
  .object({
    currentPin: pinSchema,
    newPin: pinSchema,
    confirmPin: z.string().min(1, "Please confirm your new 4-digit PIN"),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export const deleteAccountSchema = z
  .object({
    pin: pinSchema,
    confirmPin: z.string().min(1, "Please confirm your PIN"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export const forgotPasswordSchema = z.object({
  name: z.string().optional(),
  recoveryKey: z.string().min(1, "Recovery Key is required"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPin: pinSchema,
    confirmPin: z.string().min(1, "Please confirm your new 4-digit PIN"),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
