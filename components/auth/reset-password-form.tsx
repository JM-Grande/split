"use client";

import { useState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordInput } from "@/lib/schemas/auth";
import { PinInput } from "@/components/ui/pin-input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token,
      newPin: "",
      confirmPin: "",
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setGlobalError(null);
    const formData = new FormData();
    formData.append("token", data.token);
    formData.append("newPin", data.newPin);
    formData.append("confirmPin", data.confirmPin);
    
    const result = await resetPasswordAction(null, formData);
    if (result?.error) {
      setGlobalError(result.error);
    } else if (result?.success) {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">PIN Reset</CardTitle>
          <CardDescription>
            Your 4-digit PIN has been successfully reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            You can now use your new 4-digit PIN to log in to your account.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight">Reset PIN</CardTitle>
        <CardDescription>
          Enter a new 4-digit PIN for your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          <div aria-live="polite" aria-atomic="true">
            {globalError && (
              <div className="mb-4 flex w-full items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{globalError}</span>
              </div>
            )}
          </div>
          
          <input type="hidden" {...register("token")} />

          <div className="grid gap-2 mb-2">
            <Label htmlFor="newPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New 4-Digit PIN</Label>
            <Controller
              name="newPin"
              control={control}
              render={({ field }) => (
                <PinInput
                  id="newPin"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  error={!!errors.newPin}
                />
              )}
            />
            {errors.newPin && (
              <p className="text-sm text-destructive text-center">{errors.newPin.message}</p>
            )}
          </div>

          <div className="grid gap-2 mb-2">
            <Label htmlFor="confirmPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New 4-Digit PIN</Label>
            <Controller
              name="confirmPin"
              control={control}
              render={({ field }) => (
                <PinInput
                  id="confirmPin"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  error={!!errors.confirmPin}
                />
              )}
            />
            {errors.confirmPin && (
              <p className="text-sm text-destructive text-center">{errors.confirmPin.message}</p>
            )}
          </div>

        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset PIN"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Remembered your PIN?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Log in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
