import { TopNav } from "@/components/layout/top-nav";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { DashboardYearFilter } from "@/components/dashboard/dashboard-year-filter";
import { DashboardTypeFilter } from "@/components/dashboard/dashboard-type-filter";

const PerformanceCharts = dynamic(
  () => import("@/components/dashboard/performance-charts").then((mod) => mod.PerformanceCharts)
);
import { IntelligenceCenter } from "@/components/dashboard/intelligence-center";
import { salesRepository } from "@/lib/repositories/sales";
import { getDashboardMetrics, getInsights } from "@/lib/domain/sales-log";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function Home(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const yearQuery = typeof searchParams.year === 'string' ? searchParams.year : undefined;
  const typeQuery = typeof searchParams.type === 'string' ? (searchParams.type as 'all' | 'solo' | 'split') : 'all';
  
  const [weeklySales, dbUser] = await Promise.all([
    salesRepository.getAllSales(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openrouterKey: true }
    })
  ]);

  const metrics = getDashboardMetrics(weeklySales, yearQuery, typeQuery);
  const insights = getInsights(weeklySales);
  
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
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Financial Overview</h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">Track your global revenue and profit sharing.</p>
            </div>
            <div className="flex items-center gap-2">
              <DashboardTypeFilter />
              <DashboardYearFilter 
                availableYears={metrics.availableYears} 
                defaultYear={new Date().getFullYear().toString()} 
              />
            </div>
          </div>
          
          <IntelligenceCenter insights={insights} year={yearQuery || new Date().getFullYear().toString()} hasAiKey={hasAiKey} />

          <SummaryCards 
            totalGross={metrics.totalGross}
            netRevenue={metrics.netRevenue}
            partnerShare={metrics.partnerShare}
            totalExpenses={metrics.totalExpenses}
            grossGrowth={metrics.grossGrowth}
          />
          <Suspense fallback={<div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed text-muted-foreground">Loading charts…</div>}>
            <PerformanceCharts 
              monthlyDataByYear={metrics.monthlyDataByYear}
              yearlyData={metrics.yearlyData}
              availableYears={metrics.availableYears}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
