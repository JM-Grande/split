"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Bot, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesEntryFormValues } from "@/lib/schemas/sales";
import { createSalesEntry } from "@/app/sales/actions";
import { SalesEntryForm } from "./sales-form";
import { EntryAgentChat } from "./entry-agent-chat";

type EntryMode = "manual" | "ai";

export interface NewEntryModalProps {
  defaultSplitPercentage: number;
  hasAiKey: boolean;
}

export function NewEntryModal({ defaultSplitPercentage, hasAiKey }: NewEntryModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<EntryMode>("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => {
    setMode("manual");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = async (data: SalesEntryFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createSalesEntry(data);
      if (result.success) {
        toast.success("Sales entry recorded successfully");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to create entry");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className="bg-primary text-on-primary hover:bg-primary/90 font-medium"
      >
        <Plus data-icon="inline-start" aria-hidden="true" />
        New Entry
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add New Sales Entry</DialogTitle>
            <DialogDescription>
              Enter manually or describe your week in plain language.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={mode} onValueChange={(val) => setMode(val as EntryMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="manual" className="flex gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                AI Entry
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="mt-0 outline-none">
              <SalesEntryForm
                initialValues={{
                  date: new Date(),
                  weekly_sales: 0,
                  split_percentage: defaultSplitPercentage,
                  primary_expenses: 0,
                  expense_type: "",
                  notes: ""
                }}
                onSubmit={onSubmit}
                onCancel={() => setOpen(false)}
                isSubmitting={isSubmitting}
                submitLabel="Save Entry"
              />
            </TabsContent>
            <TabsContent value="ai" className="mt-0 outline-none">
              {hasAiKey ? (
                <EntryAgentChat onClose={handleClose} defaultSplitPercentage={defaultSplitPercentage} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed rounded-xl bg-muted/20">
                  <div className="relative mb-4">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-white border-2 border-background">
                      <Lock className="h-3 w-3" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground text-base mb-1">AI Sales Entry is Locked</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
                    To describe your week&apos;s sales in plain English and let the AI automatically log it, configure your OpenRouter API Key in your Profile settings.
                  </p>
                  <Button 
                    onClick={() => {
                      setOpen(false);
                      router.push("/profile");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Go to Profile Settings
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
