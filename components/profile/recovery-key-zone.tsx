"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Key, Check, Loader2, AlertTriangle } from "lucide-react";
import { generateRecoveryKeyAction } from "@/lib/actions/auth";
import { toast } from "sonner";

export function RecoveryKeyZone() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!confirm("Are you sure? Generating a new recovery key will invalidate any old ones you may have saved.")) {
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateRecoveryKeyAction();
      if (res.success && res.recoveryKey) {
        setRecoveryKey(res.recoveryKey);
        toast.success("New recovery key generated.");
      } else {
        toast.error(res.error || "Failed to generate key.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-500">
          <Key className="h-5 w-5" /> Offline Recovery Key
        </CardTitle>
        <CardDescription>
          Because Split runs offline, there is no email reset system. If you forget your password, you will need a Recovery Key to regain access to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!recoveryKey ? (
          <div className="rounded-lg border border-border p-4 bg-muted/20">
            <h4 className="text-sm font-medium mb-1">Generate a New Key</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Click below to generate a secure 16-character recovery key. You must save it in a password manager or physical vault immediately.
            </p>
            <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" className="w-full sm:w-auto gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4 text-amber-500" />}
              {isGenerating ? "Generating..." : "Generate Recovery Key"}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-2">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="font-bold text-foreground">Save This Key Now</h3>
            <p className="font-mono text-xl md:text-2xl font-bold tracking-widest text-foreground select-all bg-background/50 py-3 rounded-md border border-border">
              {recoveryKey}
            </p>
            <p className="text-sm text-muted-foreground">
              This key will only be shown once. If you lose it, we cannot recover your account.
            </p>
            <Button onClick={() => setRecoveryKey(null)} className="mt-4 gap-2">
              <Check className="h-4 w-4" /> I have saved my key
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
