"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { AiSummary } from "@/components/dashboard/ai-summary";
import { Insight } from "@/lib/domain/insights";
import { BrainCircuit, Lightbulb, FileText } from "lucide-react";

interface IntelligenceCenterProps {
  insights: Insight[];
  year: string;
  hasAiKey: boolean;
}

export function IntelligenceCenter({ insights, year, hasAiKey }: IntelligenceCenterProps) {
  const hasInsights = insights && insights.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-md">
          <BrainCircuit className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Intelligence Center</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">Smart insights and AI-powered notes summarization.</p>
        </div>
      </div>

      <Tabs defaultValue={hasInsights ? "insights" : "ai"} className="w-full mt-4">
        <div className="flex items-center pb-4">
          <TabsList className="bg-muted/50 border border-border">
            {hasInsights && (
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb className="size-4" />
                Smart Insights
              </TabsTrigger>
            )}
            <TabsTrigger value="ai" className="gap-2">
              <FileText className="size-4" />
              AI Summary
            </TabsTrigger>
          </TabsList>
        </div>

        {hasInsights && (
          <TabsContent value="insights" className="mt-0 focus-visible:ring-0">
            <InsightsPanel insights={insights} hideHeader />
          </TabsContent>
        )}
        
        <TabsContent value="ai" className="mt-0 focus-visible:ring-0">
          <AiSummary year={year} hideHeader hasAiKey={hasAiKey} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
