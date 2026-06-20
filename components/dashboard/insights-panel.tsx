import { Insight } from "@/lib/domain/sales-log";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, Trophy, Lightbulb, Activity } from "lucide-react";

interface InsightsPanelProps {
  insights: Insight[];
  hideHeader?: boolean;
}

export function InsightsPanel({ insights, hideHeader = false }: InsightsPanelProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Lightbulb className="size-5 text-primary" />
          Smart Insights
        </h2>
      )}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
        {insights.map((insight) => {
          let Icon = Lightbulb;
          let colorClass = "text-foreground bg-card";
          let iconColor = "text-primary";
          
          if (insight.type === 'trend') Icon = TrendingUp;
          if (insight.type === 'anomaly') Icon = AlertTriangle;
          if (insight.type === 'milestone') Icon = Trophy;
          if (insight.type === 'comparison') Icon = TrendingDown;
          if (insight.type === 'health') Icon = Activity;

          if (insight.severity === 'warning') {
            colorClass = "bg-orange-500/10 border-orange-500/20";
            iconColor = "text-orange-500";
          }
          if (insight.severity === 'success') {
            colorClass = "bg-emerald-500/10 border-emerald-500/20";
            iconColor = "text-emerald-500";
          }
          if (insight.severity === 'info') {
            colorClass = "bg-primary/10 border-primary/20";
            iconColor = "text-primary";
          }

          return (
            <Card key={insight.id} className={`border shadow-none h-full ${colorClass}`}>
              <CardContent className="p-4 sm:p-5 flex items-start gap-3 h-full">
                <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                  <Icon className="size-5" />
                </div>
                <p className="text-sm leading-relaxed font-medium">
                  {insight.message}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
