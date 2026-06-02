"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const [state, action, isPending] = useActionState(changePasswordAction, null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      // Reset form if success
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          Change Password
        </CardTitle>
        <CardDescription>
          Ensure your account is using a long, random password to stay secure.
        </CardDescription>
      </CardHeader>
      <form ref={formRef} id="change-password-form" action={action}>
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
            <Label htmlFor="currentPassword">Current Password</Label>
            <InputGroup>
              <InputGroupInput
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                required
                disabled={isPending}
                placeholder="••••••••"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {state?.details?.currentPassword ? (
              <p className="text-sm text-destructive">{state.details.currentPassword[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <InputGroup>
              <InputGroupInput
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
                disabled={isPending}
                placeholder="••••••••"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {state?.details?.newPassword ? (
              <p className="text-sm text-destructive">{state.details.newPassword[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <InputGroup>
              <InputGroupInput
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                disabled={isPending}
                placeholder="••••••••"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {state?.details?.confirmPassword ? (
              <p className="text-sm text-destructive">{state.details.confirmPassword[0]}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/50 px-6 py-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Save Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
