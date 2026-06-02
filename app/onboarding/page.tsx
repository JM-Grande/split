import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  // Check if onboarding is already completed
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-xl">
        <OnboardingWizard />
      </div>
    </div>
  );
}
