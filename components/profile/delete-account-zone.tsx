"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

export function DeleteAccountZone() {
  const [state, action, isPending] = useActionState(deleteAccountAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="size-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated sales data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <div className="flex justify-start">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <form action={action}>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="size-5" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete your account and remove all your data from our servers. 
                      This includes all weekly sales records you have recorded.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="my-6 space-y-4 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-foreground">
                    <p className="text-sm font-medium">Please enter your password to confirm:</p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="delete-password">Current Password</Label>
                        <InputGroup>
                          <InputGroupInput
                            id="delete-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            disabled={isPending}
                            placeholder="••••••••"
                            className="bg-background"
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                        {state?.details?.password ? (
                          <p className="text-sm text-destructive font-medium">{state.details.password[0]}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-delete-password">Confirm Password</Label>
                        <InputGroup>
                          <InputGroupInput
                            id="confirm-delete-password"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            disabled={isPending}
                            placeholder="••••••••"
                            className="bg-background"
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                        {state?.details?.confirmPassword ? (
                          <p className="text-sm text-destructive font-medium">{state.details.confirmPassword[0]}</p>
                        ) : null}
                      </div>
                    </div>

                    <div aria-live="polite" aria-atomic="true">
                      {state?.error ? (
                        <div className="flex w-full items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                          <AlertCircle className="size-4" />
                          <span>{state.error}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel type="button" disabled={isPending}>Cancel</AlertDialogCancel>
                    <Button 
                      type="submit" 
                      variant="destructive" 
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
                      Delete Permanently
                    </Button>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
