"use client";

import { useState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordInput } from "@/lib/schemas/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setGlobalError(null);
    const formData = new FormData();
    formData.append("token", data.token);
    formData.append("newPassword", data.newPassword);
    formData.append("confirmPassword", data.confirmPassword);
    
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
          <CardTitle className="text-2xl font-semibold tracking-tight">Password Reset</CardTitle>
          <CardDescription>
            Your password has been successfully reset.
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
            You can now use your new password to log in to your account.
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
        <CardTitle className="text-2xl font-semibold tracking-tight">Reset Password</CardTitle>
        <CardDescription>
          Enter a new password for your account.
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
          
          {/* Hidden input for token to ensure it submits if someone relied on native form behavior, 
              though react-hook-form handles it directly in onSubmit. */}
          <input type="hidden" {...register("token")} />

          <div className="grid gap-2 mb-2">
            <Label htmlFor="newPassword" title="New Password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</Label>
            <div className="relative">
              <Input 
                id="newPassword" 
                type={showPassword ? "text" : "password"} 
                autoComplete="new-password"
                disabled={isSubmitting}
                className={errors.newPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                {...register("newPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="grid gap-2 mb-2">
            <Label htmlFor="confirmPassword" title="Confirm Password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
            <div className="relative">
              <Input 
                id="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                autoComplete="new-password"
                disabled={isSubmitting}
                className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                {...register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showConfirmPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Log in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
