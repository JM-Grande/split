"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PinInput } from "@/components/ui/pin-input";

export function ChangePasswordForm() {
  const [state, action, isPending] = useActionState(changePasswordAction, null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "PIN updated successfully.");
    }
  }, [state]);

  const handleFormAction = async (formData: FormData) => {
    await action(formData);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    formRef.current?.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          Change PIN
        </CardTitle>
        <CardDescription>
          Ensure your account is protected with a secure 4-digit PIN.
        </CardDescription>
      </CardHeader>
      <form ref={formRef} id="change-password-form" action={handleFormAction}>
        <CardContent className="space-y-4 pb-8">
          <div aria-live="polite" aria-atomic="true">
            {state?.error ? (
              <div className="mb-4 flex w-full items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                <AlertCircle className="size-4" />
                <span>{state.error}</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current 4-Digit PIN</Label>
            <PinInput
              id="currentPin"
              name="currentPin"
              value={currentPin}
              onChange={setCurrentPin}
              disabled={isPending}
              error={!!state?.details?.currentPin}
            />
            {state?.details?.currentPin ? (
              <p className="text-sm text-destructive text-center">{state.details.currentPin[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New 4-Digit PIN</Label>
            <PinInput
              id="newPin"
              name="newPin"
              value={newPin}
              onChange={setNewPin}
              disabled={isPending}
              error={!!state?.details?.newPin}
            />
            {state?.details?.newPin ? (
              <p className="text-sm text-destructive text-center">{state.details.newPin[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New 4-Digit PIN</Label>
            <PinInput
              id="confirmPin"
              name="confirmPin"
              value={confirmPin}
              onChange={setConfirmPin}
              disabled={isPending}
              error={!!state?.details?.confirmPin}
            />
            {state?.details?.confirmPin ? (
              <p className="text-sm text-destructive text-center">{state.details.confirmPin[0]}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/50 px-6 py-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Save PIN
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
