"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateDefaultSplitAction } from "@/lib/actions/user";

export function SettingsModal({ initialPercentage }: { initialPercentage: number }) {
  const [open, setOpen] = useState(false);
  const [percentage, setPercentage] = useState<string>(initialPercentage.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    const val = parseInt(percentage, 10);
    if (isNaN(val) || val < 1 || val > 100) {
      toast.error("Please enter a valid percentage between 1 and 100.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateDefaultSplitAction(val);
      if (result.success) {
        toast.success("Default split percentage updated.");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to update settings.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setPercentage(initialPercentage.toString());
          setOpen(true);
        }}
        className="bg-transparent border-outline-variant text-foreground hover:bg-surface-bright shadow-none"
      >
        <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
        Settings
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sales Preferences</DialogTitle>
            <DialogDescription>
              Configure your default profit split percentage. This applies to new entries by default.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="default_split">Default Owner Split (%)</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setPercentage("100")}
                >
                  Set to 100% (Solo Mode)
                </Button>
              </div>
              <Input
                id="default_split"
                type="number"
                min="1"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your partner will receive the remaining {100 - (parseInt(percentage) || 0)}%.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
