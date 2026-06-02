import { LoginForm } from "@/components/auth/login-form";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ verified?: string; reset?: string }> }) {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const isVerified = params.verified === "true";
  const isReset = params.reset === "true";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm isVerified={isVerified} isReset={isReset} />
      </div>
    </div>
  );
}
