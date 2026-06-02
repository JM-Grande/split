import { TopNav } from "@/components/layout/top-nav";
import { SalesTable } from "@/components/sales/sales-table";
import { NewEntryModal } from "@/components/sales/new-entry-modal";
import { ExportCsvButton } from "@/components/sales/export-csv-button";
import { salesRepository } from "@/lib/repositories/sales";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { SettingsModal } from "@/components/sales/settings-modal";

export default async function SalesLogPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [weeklySales, dbUser] = await Promise.all([
    salesRepository.getAllSales(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { default_split_percentage: true, openrouterKey: true }
    })
  ]);
  const defaultSplit = dbUser?.default_split_percentage ?? 60;
  const hasAiKey = !!dbUser?.openrouterKey;

  return (
    <div className="min-h-dvh bg-background flex flex-col w-full">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-background border border-border px-4 py-2 rounded-md z-50 text-sm font-medium"
      >
        Skip to main content
      </a>
      <TopNav user={session?.user} />
      <main id="main-content" className="flex-1 py-6 sm:py-10 outline-none" tabIndex={-1}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 w-full space-y-6 sm:space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Weekly Sales Log</h1>

              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">Review and audit historical weekly performance, gross intakes, operating expenses, and final net revenue settlements across all terminal networks.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <SettingsModal initialPercentage={defaultSplit} />
              <ExportCsvButton data={weeklySales} />
              <NewEntryModal defaultSplitPercentage={defaultSplit} hasAiKey={hasAiKey} />
            </div>
          </div>
          
          <SalesTable data={weeklySales} />
        </div>
      </main>
    </div>
  );
}
