"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { toast } from "sonner";
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Percent, 
  Key, 
  Check, 
  ShieldAlert,
  Coins,
  Bot
} from "lucide-react";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    defaultSplitPercentage: 60,
    openrouterKey: "",
    aiModel: "deepseek/deepseek-v4-flash",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSplitChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      defaultSplitPercentage: Math.max(1, Math.min(100, value)),
    }));
  };

  // Validate current step
  const validateStep = () => {
    const stepErrors: Record<string, string[]> = {};

    if (step === 2) {
      if (!formData.name.trim()) stepErrors.name = ["Name is required"];
      if (!formData.email.trim()) {
        stepErrors.email = ["Email is required"];
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        stepErrors.email = ["Please enter a valid email address"];
      }
      if (formData.password.length < 8) {
        stepErrors.password = ["Password must be at least 8 characters long"];
      }
      if (formData.password !== formData.confirmPassword) {
        stepErrors.confirmPassword = ["Passwords do not match"];
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const response = await completeOnboardingAction({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        defaultSplitPercentage: formData.defaultSplitPercentage,
        openrouterKey: formData.openrouterKey || null,
        aiModel: formData.aiModel,
      });

      if (response.success && response.recoveryKey) {
        setGeneratedRecoveryKey(response.recoveryKey as string);
        setStep(5);
        toast.success("Setup complete! Please save your recovery key.");
      } else if (response.success) {
        toast.success("Setup complete! Log in to get started.");
        router.push("/login?verified=true");
      } else {
        toast.error(response.error || "Setup failed.");
        if (response.details) {
          setErrors(response.details as Record<string, string[]>);
        }
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const partnerPercentage = 100 - formData.defaultSplitPercentage;

  return (
    <Card className="w-full max-w-xl mx-auto border-border shadow-2xl relative overflow-hidden bg-card transition-all duration-300">
      {/* Visual Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out" 
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {step === 1 && (
        <div className="animate-in fade-in duration-300">
          <CardHeader className="text-center pt-8">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary animate-bounce">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome to Split</CardTitle>
            <CardDescription className="text-base mt-2">
              Let&apos;s get your local ledger set up in just a few clicks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 py-6">
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              Split is a local-first application designed to help businesses log sales, 
              deduct expenses, and automatically calculate shares between you and your partners.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1 text-sm">
                  <Coins className="h-4 w-4 text-primary" /> 100% Local-First
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your transactions and credentials are saved directly to an SQLite database on your device. Absolutely no cloud tracking.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1 text-sm">
                  <Bot className="h-4 w-4 text-primary" /> Optional AI Insights
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Type sales data in plain English and let AI format it, or view automatic monthly summaries of operational notes.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end p-8 border-t border-border mt-4">
            <Button onClick={nextStep} className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in duration-300">
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl font-bold">Admin Account Setup</CardTitle>
            <CardDescription>
              Create your local administrator credentials to secure your database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. John Doe" 
                value={formData.name} 
                onChange={handleChange}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="e.g. admin@shop.com" 
                value={formData.email} 
                onChange={handleChange}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="Minimum 8 characters" 
                value={formData.password} 
                onChange={handleChange}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password[0]}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                placeholder="Re-enter password" 
                value={formData.confirmPassword} 
                onChange={handleChange}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword[0]}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-8 border-t border-border mt-4">
            <Button variant="ghost" onClick={prevStep} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={nextStep} className="gap-2">
              Next Step <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in fade-in duration-300">
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" /> Revenue Split Preferences
            </CardTitle>
            <CardDescription>
              Configure how sales are split between you and your partners by default.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 py-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="defaultSplitPercentage" className="text-sm font-medium">
                  Your Primary Share (%)
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    id="defaultSplitPercentage"
                    className="w-20 text-right h-9 font-semibold font-mono"
                    value={formData.defaultSplitPercentage}
                    onChange={(e) => handleSplitChange(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-muted-foreground font-semibold">%</span>
                </div>
              </div>
              
              {/* Range Slider */}
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={formData.defaultSplitPercentage}
                onChange={(e) => handleSplitChange(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Split Visualization Box */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Split Breakdown (Example)</h4>
              <div className="flex w-full h-8 rounded-full overflow-hidden border border-border shadow-inner font-mono text-xs font-bold text-white">
                <div 
                  className="bg-primary flex items-center justify-center transition-all duration-300"
                  style={{ width: `${formData.defaultSplitPercentage}%` }}
                >
                  {formData.defaultSplitPercentage >= 15 && `Admin: ${formData.defaultSplitPercentage}%`}
                </div>
                <div 
                  className="bg-secondary-container text-on-secondary-container flex items-center justify-center transition-all duration-300"
                  style={{ width: `${partnerPercentage}%` }}
                >
                  {partnerPercentage >= 15 && `Partner: ${partnerPercentage}%`}
                </div>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 pl-1 list-disc list-inside">
                <li>Primary share goes to you.</li>
                <li>Secondary share ({partnerPercentage}%) goes to your business partner.</li>
                <li>Expenses logged will be deducted directly from **your share** (Primary Net Revenue).</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-8 border-t border-border mt-4">
            <Button variant="ghost" onClick={prevStep} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={nextStep} className="gap-2">
              Next Step <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </div>
      )}

      {step === 4 && (
        <div className="animate-in fade-in duration-300">
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Local AI Setup (Optional)
            </CardTitle>
            <CardDescription>
              Configure OpenRouter to enable plain English entries and summary insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8 py-6">
            <div className="grid gap-2">
              <Label htmlFor="openrouterKey" className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" /> OpenRouter API Key
              </Label>
              <Input 
                id="openrouterKey" 
                type="password"
                placeholder="sk-or-v1-..." 
                value={formData.openrouterKey} 
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground leading-normal">
                You can generate a key at <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-primary underline">openrouter.ai</a>.
                If left blank, AI functions will be disabled but the app is fully usable manually.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="aiModel">Preferred Model</Label>
              <Input 
                id="aiModel" 
                placeholder="e.g. deepseek/deepseek-v4-flash" 
                value={formData.aiModel} 
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                We recommend <span className="font-mono text-xs">deepseek/deepseek-v4-flash</span> for fast, cost-effective processing.
              </p>
            </div>

            <div className="flex gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-muted-foreground leading-relaxed mt-2">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Notice:</strong> Your API keys are stored encrypted locally in your SQLite database. The app makes requests directly from your machine to OpenRouter.
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-8 border-t border-border mt-4">
            <Button variant="ghost" onClick={prevStep} className="gap-2" disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={handleFinish} className="gap-2" disabled={isSubmitting}>
              {isSubmitting ? "Setting Up..." : (
                <>
                  Complete Setup <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </div>
      )}

      {step === 5 && generatedRecoveryKey && (
        <div className="animate-in fade-in duration-300">
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-amber-500">
              <ShieldAlert className="h-6 w-6" /> Save Your Recovery Key
            </CardTitle>
            <CardDescription className="text-base text-foreground">
              Because Split runs completely offline, there is no email server to reset your password.
              If you forget your password, this key is the <strong>ONLY</strong> way to recover your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 py-6">
            <div className="p-6 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 text-center space-y-4">
              <p className="font-mono text-2xl font-bold tracking-wider text-foreground select-all break-all">
                {generatedRecoveryKey}
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Copy this key and save it in a password manager.</li>
              <li>Do not lose this key. We cannot recover your data without it.</li>
              <li>Anyone with this key and your email can reset your password.</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-end p-8 border-t border-border mt-4 bg-muted/20">
            <Button onClick={() => router.push("/login?verified=true")} className="gap-2" variant="default">
              I have saved it <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </div>
      )}
    </Card>
  );
}
