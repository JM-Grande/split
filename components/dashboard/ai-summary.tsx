"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, AlertTriangle, Bot, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { summarizeNotesAction } from "@/lib/actions/ai";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface AiSummaryProps {
  year: string;
  hideHeader?: boolean;
  hasAiKey: boolean;
}

export function AiSummary({ year, hideHeader = false, hasAiKey }: AiSummaryProps) {
  const router = useRouter();
  const currentMonthStr = new Date().getMonth().toString();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hasAiKey) {
    return (
      <div className="space-y-4 h-full flex flex-col animate-in fade-in duration-300">
        {!hideHeader && (
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            AI Notes Summarization
          </h2>
        )}
        <Card className="border-border bg-card/50 flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
          <div className="relative mb-4">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
              <Bot className="h-6 w-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-white border-2 border-background">
              <Lock className="h-3 w-3" />
            </div>
          </div>
          <h3 className="font-semibold text-foreground text-base mb-1">AI Summaries are Locked</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
            Summarize weekly operating notes, spot business trends, and get an automated high-level overview using local AI.
          </p>
          <Button 
            onClick={() => router.push("/profile")}
            variant="outline"
            size="sm"
          >
            Configure API Key
          </Button>
        </Card>
      </div>
    );
  }

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    setSummary(null);

    const result = await summarizeNotesAction(year, selectedMonth);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setSummary(result.data);
    }
    
    setIsLoading(false);
  }

  const monthName = MONTHS[parseInt(selectedMonth, 10)];

  return (
    <div className="space-y-4 h-full flex flex-col">
      {!hideHeader && (
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          AI Notes Summarization
        </h2>
      )}
      <Card className="border-border bg-card/50 flex-1 flex flex-col">
        <CardHeader className="pb-3 flex flex-col gap-4">
          <CardDescription>
            Generate an AI summary of your notes for a specific month in {year}.
          </CardDescription>
          <div className="flex items-center gap-2 w-full">
          <Select value={selectedMonth} onValueChange={(val) => {
            setSelectedMonth(val);
            setError(null);
            setSummary(null);
          }}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={isLoading || (error !== null && error.includes("Too many requests"))} className="flex-1 sm:flex-none">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Generate
          </Button>
        </div>
      </CardHeader>
      
      {(summary || error) && (
        <CardContent>
          {error ? (
             <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
               <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
               <span>{error}</span>
             </div>
          ) : (
            <div className="bg-muted/40 border border-border rounded-lg p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              <p className="font-semibold text-primary mb-2">{monthName} {year} Summary:</p>
              {summary}
            </div>
          )}
        </CardContent>
      )}
      </Card>
    </div>
  );
}
