import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Reset Password | Split",
  description: "Reset your Split password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4 sm:p-6 md:p-10">
      {!token ? (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Invalid Link</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              The password reset link is invalid or missing the reset token. Please request a new link.
            </p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/login">Return to Login</Link>
          </Button>
        </div>
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </div>
  );
}
