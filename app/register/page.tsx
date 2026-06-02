import { RegisterForm } from "@/components/auth/register-form";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    redirect("/onboarding");
  }
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  );
}