"use client";

import { useState, useTransition } from "react";
import { updateAiSettingsAction } from "@/lib/actions/user";
import { testAiConnectionAction } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Key, HelpCircle, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";

export function AiSettingsForm({ initialKey, initialModel }: { initialKey: string | null, initialModel: string }) {
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState(initialKey || "");
  const [model, setModel] = useState(initialModel || "deepseek/deepseek-v4-flash");
  const [showTutorial, setShowTutorial] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleRemove = () => {
    startTransition(async () => {
      const result = await updateAiSettingsAction(null, "deepseek/deepseek-v4-flash");
      if (result.success) {
        setApiKey("");
        setModel("deepseek/deepseek-v4-flash");
        toast.success("AI Settings cleared.");
      } else {
        toast.error(result.error || "Failed to clear AI settings.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateAiSettingsAction(apiKey, model);
      if (result.success) {
        toast.success("AI Settings updated successfully.");
      } else {
        toast.error(result.error || "Failed to update AI settings.");
      }
    });
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error("Please enter an API key to test.");
      return;
    }
    setIsTesting(true);
    try {
      const res = await testAiConnectionAction(apiKey);
      if (res.success) {
        toast.success(`Connection successful! Key: ${res.data || "Active"}`);
      } else {
        toast.error(res.error || "Connection failed.");
      }
    } catch {
      toast.error("Connection failed. Check your internet connection.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> AI Configuration
          </CardTitle>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowTutorial(!showTutorial)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {showTutorial ? "Hide Setup Guide" : "How to get a key?"}
          </Button>
        </div>
        <CardDescription>
          Configure local AI features. These settings are stored locally in your SQLite database and are never sent to external servers.
        </CardDescription>
      </CardHeader>
      
      {/* Collapsible Step-by-Step Tutorial */}
      {showTutorial && (
        <CardContent className="border-b border-border bg-muted/20 py-4 px-6 animate-in slide-in-from-top-2 duration-300">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-foreground">
            How to get an OpenRouter API Key
          </h4>
          <ol className="space-y-4 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">1</span>
              <div>
                <strong>Go to OpenRouter:</strong> Open{" "}
                <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  openrouter.ai <ExternalLink className="h-3 w-3" />
                </a>{" "}
                and sign in or create an account.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">2</span>
              <div>
                <strong>Create a Key:</strong> Go to the Keys tab at{" "}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  openrouter.ai/keys <ExternalLink className="h-3 w-3" />
                </a>{" "}
                and click <strong>Create Key</strong>.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">3</span>
              <div>
                <strong>Copy Key:</strong> Set a name (e.g., &quot;Split&quot;) and click create. Copy the generated key.
              </div>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">4</span>
              <div>
                <strong>Save Key:</strong> Paste the copied key (starts with <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-[10px]">sk-or-v1-...</code>) into the input below, test the connection, and save!
              </div>
            </li>
          </ol>
        </CardContent>
      )}

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" /> OpenRouter API Key
            </Label>
            <div className="flex gap-2">
              <Input 
                id="apiKey" 
                type="password" 
                placeholder="sk-or-v1-..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value.replace(/\s/g, ""))}
                disabled={isPending}
                className="font-mono text-sm"
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleTestConnection}
                disabled={isTesting || !apiKey}
                className="whitespace-nowrap flex items-center gap-1.5"
              >
                {isTesting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Test
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Required for natural language entries and AI summaries.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Preferred AI Model</Label>
            <Input 
              id="model" 
              type="text" 
              placeholder="e.g. deepseek/deepseek-v4-flash" 
              value={model}
              onChange={(e) => setModel(e.target.value.replace(/\s/g, ""))}
              disabled={isPending}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">Any model supported by OpenRouter (e.g., <code className="bg-muted px-1 rounded text-foreground font-mono text-[10px]">meta-llama/llama-3.1-8b-instruct</code>)</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={handleRemove} disabled={isPending || !apiKey}>
            Clear Keys
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
