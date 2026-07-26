"use client";

import { useState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/schemas/auth";
import { PinInput } from "@/components/ui/pin-input";

export function RegisterForm() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      pin: "",
      confirmPin: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setGlobalError(null);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("pin", data.pin);
    formData.append("confirmPin", data.confirmPin);
    
    const result = await registerAction(null, formData);
    if (result?.error) {
      setGlobalError(result.error);
    } else if (result?.success) {
      router.push("/login?verified=true");
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight">Register</CardTitle>
        <CardDescription>
          Create an account with your name and a 4-digit PIN.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          <div aria-live="polite" aria-atomic="true">
            {globalError && (
              <div className="mb-4 flex w-full flex-col gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{globalError}</span>
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="e.g. John Doe" 
              autoComplete="name"
              disabled={isSubmitting}
              className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">4-Digit PIN</Label>
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
                />
              )}
            />
            {errors.pin && (
              <p className="text-sm text-destructive text-center">{errors.pin.message}</p>
            )}
          </div>

          <div className="grid gap-2 mb-2">
            <Label htmlFor="confirmPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm 4-Digit PIN</Label>
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
            {isSubmitting ? "Registering..." : "Sign up"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}