"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { loginSchema, LoginInput, forgotPasswordSchema, ForgotPasswordInput } from "@/lib/schemas/auth";
import { PinInput } from "@/components/ui/pin-input";

export function LoginForm({ isVerified, isReset }: { isVerified?: boolean; isReset?: boolean }) {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  
  const [forgotSuccess, setForgotSuccess] = useState<{message: string} | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      pin: "",
    },
  });

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
    reset: resetForgot
  } = useForm<ForgotPasswordInput>({
    resolver: standardSchemaResolver(forgotPasswordSchema),
    defaultValues: {
      recoveryKey: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setGlobalError(null);
    
    try {
      const result = await signIn("credentials", {
        pin: data.pin,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setGlobalError("Invalid 4-digit PIN.");
        } else {
          setGlobalError("Something went wrong.");
        }
      } else if (result?.ok) {
        window.location.assign("/");
      }
    } catch {
      setGlobalError("Something went wrong.");
    }
  };

  const onForgotSubmit = async (data: ForgotPasswordInput) => {
    setForgotError(null);
    setForgotSuccess(null);
    
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    formData.append("recoveryKey", data.recoveryKey);
    
    const result = await forgotPasswordAction(null, formData);
    if (result?.error) {
      setForgotError(result.error);
    } else if (result?.success && result?.resetLink) {
      router.push(result.resetLink);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight">Login</CardTitle>
        <CardDescription>
          Enter your 4-digit PIN to log in.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          <div aria-live="polite" aria-atomic="true">
            {isVerified && !globalError && !isReset && (
              <div className="mb-4 flex w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                <CheckCircle className="h-4 w-4" />
                <span>Account created successfully. You can now log in.</span>
              </div>
            )}
            {isReset && !globalError && (
              <div className="mb-4 flex w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                <CheckCircle className="h-4 w-4" />
                <span>PIN reset successfully. You can now log in.</span>
              </div>
            )}
            {globalError && (
              <div className="mb-4 flex w-full items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{globalError}</span>
              </div>
            )}
          </div>

          <div className="grid gap-2 mb-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">4-Digit PIN</Label>
              <Dialog open={isForgotModalOpen} onOpenChange={(open) => {
                setIsForgotModalOpen(open);
                if (!open) {
                  setForgotSuccess(null);
                  setForgotError(null);
                  resetForgot();
                }
              }}>
                <DialogTrigger asChild>
                  <button type="button" className="text-xs font-medium text-muted-foreground hover:text-primary underline underline-offset-4">
                    Forgot PIN?
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:rounded-[16px]">
                  <DialogHeader>
                    <DialogTitle>Offline PIN Recovery</DialogTitle>
                    <DialogDescription>
                      Enter your 16-character Recovery Key to securely reset your PIN.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.stopPropagation();
                    handleForgotSubmit(onForgotSubmit)(e);
                  }} className="grid gap-4 py-4">
                    <div aria-live="polite" aria-atomic="true">
                      {forgotSuccess && (
                        <div className="mb-4 flex flex-col w-full gap-3 rounded-md border border-primary/30 bg-primary/10 p-4 text-sm font-medium text-primary">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            <span>{forgotSuccess.message}</span>
                          </div>
                        </div>
                      )}
                      {forgotError && (
                        <div className="mb-4 flex w-full items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span>{forgotError}</span>
                        </div>
                      )}
                    </div>
                    {!forgotSuccess && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="forgot-recoveryKey" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recovery Key</Label>
                          <Input
                            id="forgot-recoveryKey"
                            type="text"
                            placeholder="SPLT-AAAA-BBBB-CCCC"
                            disabled={isForgotSubmitting}
                            className={forgotErrors.recoveryKey ? "border-destructive focus-visible:ring-destructive font-mono" : "font-mono"}
                            {...registerForgot("recoveryKey")}
                          />
                          {forgotErrors.recoveryKey && (
                            <p className="text-sm text-destructive">{forgotErrors.recoveryKey.message}</p>
                          )}
                        </div>
                        <Button type="submit" disabled={isForgotSubmitting} className="w-full mt-2">
                          {isForgotSubmitting ? "Verifying..." : "Verify & Reset"}
                        </Button>
                      </>
                    )}
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Controller
              name="pin"
              control={control}
              render={({ field }) => (
                <PinInput
                  id="pin"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  error={!!errors.pin}
                  autoFocus
                />
              )}
            />
            {errors.pin && (
              <p className="text-sm text-destructive text-center">{errors.pin.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
