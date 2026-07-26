"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Copy, Check, ExternalLink, MessageSquare } from "lucide-react";

interface FeedbackModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const SUPPORT_EMAIL = "xopaslabs@gmail.com";
const GITHUB_ISSUES_URL = "https://github.com/JM-Grande/split/issues";

export function FeedbackModal({ open, onOpenChange, trigger }: FeedbackModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      toast.success("Support email copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(`Could not copy automatically. Support email: ${SUPPORT_EMAIL}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
            Send Feedback or Report Bugs
          </DialogTitle>
          <DialogDescription>
            We value your feedback! Send us a message or report any bugs directly to our support team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Direct Support Email Box */}
          <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="truncate">
                <span className="text-muted-foreground block text-[11px] font-medium">Direct Support Email</span>
                <span className="font-mono font-semibold text-foreground select-all text-sm">{SUPPORT_EMAIL}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyEmail}
              className="h-8 gap-1.5 shrink-0 text-xs font-medium"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="pt-1 flex items-center justify-between gap-2 border-t border-border">
            <a
              href={GITHUB_ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors font-medium"
            >
              GitHub Issues
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" className="text-xs px-4">
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
