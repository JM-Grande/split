"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Send, RotateCcw, AlertTriangle, CheckCircle2, Pencil, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ParsedEntry } from "@/lib/ai/entry-agent";
import { createWeeklySale } from "@/lib/domain/sales";
import { createSalesEntry } from "@/app/sales/actions";
import { SalesEntryFormValues } from "@/lib/schemas/sales";
import { parseEntryAction } from "@/lib/actions/ai";
import { SalesEntryForm } from "./sales-form";

interface EntryAgentChatProps {
  onClose: () => void;
  defaultSplitPercentage: number;
}

// ─── Message types ────────────────────────────────────────────────────────────

type UserMessage = { id: string; role: "user"; text: string };
type AgentMessagePayload =
  | { role: "agent"; type: "thinking" }
  | { role: "agent"; type: "entry"; entry: ParsedEntry }
  | { role: "agent"; type: "question"; text: string }
  | { role: "agent"; type: "error"; text: string };

type AgentMessage = AgentMessagePayload & { id: string };

type Message = UserMessage | AgentMessage;

// What the agent is currently waiting for the user to answer
type PendingQuestion = "ask_sales" | "confirm_no_expense" | "expense_type" | "notes" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

let msgId = 0;
function nextId() {
  return `m${++msgId}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
}

const SKIP_WORDS = ["no", "none", "skip", "nothing", "nope", "n/a", "na", "-"];
function isSkip(text: string): boolean {
  return SKIP_WORDS.includes(text.trim().toLowerCase());
}

/** Build the queue of follow-up questions for a freshly parsed entry. */
function buildFollowUpQueue(entry: ParsedEntry, skipped: Set<PendingQuestion>): PendingQuestion[] {
  const queue: PendingQuestion[] = [];
  if (entry.grossSales === null && !skipped.has("ask_sales")) queue.push("ask_sales");
  if (entry.expenses === 0 && !skipped.has("confirm_no_expense")) queue.push("confirm_no_expense");
  if (entry.expenses > 0 && !entry.expenseType && !skipped.has("expense_type")) queue.push("expense_type");
  if (!entry.notes && !skipped.has("notes")) queue.push("notes");
  return queue;
}

/** Return the question text for a given pending question. */
function questionText(q: PendingQuestion, entry: ParsedEntry): string {
  if (q === "ask_sales")
    return "What were your total sales for the week?";
  if (q === "confirm_no_expense")
    return "You didn't mention any expenses. Did you have any expenses this week? (Type 'no' to confirm 0, or enter your expenses)";
  if (q === "expense_type")
    return `What was the ₱${entry.expenses.toLocaleString()} expense for? (e.g. electricity, router repair)`;
  if (q === "notes")
    return "Anything to note this week? (machine issues, foot traffic, slow days, etc.) Type 'skip' if none.";
  return "";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EntryAgentChat({ onClose, defaultSplitPercentage }: EntryAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: "agent",
      type: "question",
      text: "Describe your week's sales — just type naturally. For example:\n\"Sales this week 5200, spent 800 on router repair, 2 machines were down Tuesday.\"",
    },
  ]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<ParsedEntry | null>(null);
  const [followUpQueue, setFollowUpQueue] = useState<PendingQuestion[]>([]);
  const [activePendingQ, setActivePendingQ] = useState<PendingQuestion>(null);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<PendingQuestion>>(new Set());
  const [isEditing, setIsEditing] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Append helpers ───────────────────────────────────────────────────────

  function addUserMessage(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
  }

  function addAgentMessage(msg: AgentMessagePayload) {
    setMessages((prev) => [...prev, { id: nextId(), ...msg } as AgentMessage]);
  }

  function replaceThinking(msg: AgentMessagePayload) {
    setMessages((prev) => {
      const idx = prev.findLastIndex((m) => m.role === "agent" && m.type === "thinking");
      if (idx === -1) return [...prev, { id: nextId(), ...msg } as AgentMessage];
      const next = [...prev];
      next[idx] = { id: nextId(), ...msg } as AgentMessage;
      return next;
    });
  }

  // ── Ask the next follow-up from the queue ────────────────────────────────

  function askNext(queue: PendingQuestion[], entry: ParsedEntry) {
    if (queue.length === 0) {
      setActivePendingQ(null);
      setFollowUpQueue([]);
      // Refresh the entry card (no new question)
      addAgentMessage({ role: "agent", type: "entry", entry });
      return;
    }
    const [next, ...rest] = queue;
    setActivePendingQ(next);
    setFollowUpQueue(rest);
    addAgentMessage({ role: "agent", type: "question", text: questionText(next, entry) });
  }

  // ── Handle initial parse ─────────────────────────────────────────────────

  async function parseEntry(text: string, existingDraft?: ParsedEntry | null, pendingQ?: PendingQuestion) {
    setIsWaiting(true);
    addAgentMessage({ role: "agent", type: "thinking" });

    try {
      const res = await parseEntryAction(text, existingDraft ?? undefined, pendingQ);

      if (res.error) {
        replaceThinking({ role: "agent", type: "error", text: res.error });
        return;
      }

      if (!res.data) {
        replaceThinking({ role: "agent", type: "error", text: "Something went wrong." });
        return;
      }

      const entry = res.data;

      setCurrentEntry(entry);
      replaceThinking({ role: "agent", type: "entry", entry });

      // Show warnings as follow-up messages
      for (const w of entry.warnings) {
        addAgentMessage({ role: "agent", type: "question", text: `⚠️ ${w}` });
      }

      // Build follow-up question queue
      const queue = buildFollowUpQueue(entry, skippedQuestions);
      askNext(queue, entry);
    } catch {
      replaceThinking({ role: "agent", type: "error", text: "Network error. Please try again." });
    } finally {
      setIsWaiting(false);
    }
  }

  // ── Main submit handler ──────────────────────────────────────────────────

  async function handleSend(text: string) {
    if (!text || isWaiting || isSaving) return;

    addUserMessage(text);

    if (activePendingQ && currentEntry) {
      if (isSkip(text)) {
        const nextSkipped = new Set(skippedQuestions).add(activePendingQ);
        setSkippedQuestions(nextSkipped);
        askNext(followUpQueue, currentEntry);
        return;
      }
      
      // For pure text fields, instantaneous local merging is 100% reliable and fast
      if (activePendingQ === "expense_type") {
        const updated = { ...currentEntry, expenseType: text };
        setCurrentEntry(updated);
        askNext(followUpQueue, updated);
        return;
      }
      if (activePendingQ === "notes") {
        const updated = { ...currentEntry, notes: text };
        setCurrentEntry(updated);
        askNext(followUpQueue, updated);
        return;
      }
    }

    await parseEntry(text, currentEntry, activePendingQ);
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave(entry: ParsedEntry) {
    if (!entry.grossSales) return;
    setIsSaving(true);

    const formData: SalesEntryFormValues = {
      date: entry.date ? new Date(entry.date) : new Date(),
      weekly_sales: entry.grossSales,
      split_percentage: entry.splitPercentage ?? defaultSplitPercentage,
      primary_expenses: entry.expenses,
      expense_type: entry.expenseType ?? undefined,
      notes: entry.notes ?? undefined,
    };

    try {
      const result = await createSalesEntry(formData);
      if (result.success) {
        toast.success("Sales entry saved!");
        onClose();
      } else {
        toast.error(result.error ?? "Failed to save entry.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Manual edit (shows SalesEntryForm pre-filled) ────────────────────────

  async function handleManualSubmit(data: SalesEntryFormValues) {
    setIsSaving(true);
    try {
      const result = await createSalesEntry(data);
      if (result.success) {
        toast.success("Sales entry saved!");
        onClose();
      } else {
        toast.error(result.error ?? "Failed to save entry.");
        setIsSaving(false);
      }
    } catch {
      toast.error("An unexpected error occurred.");
      setIsSaving(false);
    }
  }

  function handleStartOver() {
    setMessages([
      {
        id: nextId(),
        role: "agent",
        type: "question",
        text: "Describe your week's sales — just type naturally. For example:\n\"Sales this week 5200, spent 800 on router repair, 2 machines were down Tuesday.\"",
      },
    ]);
    setCurrentEntry(null);
    setFollowUpQueue([]);
    setSkippedQuestions(new Set());
    setActivePendingQ(null);
    setIsEditing(false);
  }

  // ── Editing mode ─────────────────────────────────────────────────────────

  if (isEditing && currentEntry) {
    const prefilled: SalesEntryFormValues = {
      date: currentEntry.date ? new Date(currentEntry.date) : new Date(),
      weekly_sales: currentEntry.grossSales ?? 0,
      split_percentage: currentEntry.splitPercentage ?? defaultSplitPercentage,
      primary_expenses: currentEntry.expenses,
      expense_type: currentEntry.expenseType ?? undefined,
      notes: currentEntry.notes ?? undefined,
    };
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Edit the pre-filled values and save.</p>
        <SalesEntryForm
          onSubmit={handleManualSubmit}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isSaving}
          submitLabel="Save Entry"
          initialValues={prefilled}
        />
      </div>
    );
  }

  // ─── Main chat render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[480px]">
      {/* Message history */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-2 pr-1" aria-live="polite">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isSaving={isSaving}
            onSave={handleSave}
            onEdit={() => setIsEditing(true)}
            onStartOver={handleStartOver}
            defaultSplitPercentage={defaultSplitPercentage}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="pt-4 border-t mt-2">
        <ChatInput 
          onSend={handleSend}
          isWaiting={isWaiting}
          isSaving={isSaving}
          activePendingQ={activePendingQ}
        />
      </div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: Message;
  isSaving: boolean;
  onSave: (entry: ParsedEntry) => void;
  onEdit: () => void;
  onStartOver: () => void;
  defaultSplitPercentage: number;
}

function MessageBubble({ msg, isSaving, onSave, onEdit, onStartOver, defaultSplitPercentage }: MessageBubbleProps) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap">
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === "thinking") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="animate-pulse">Parsing your entry…</span>
      </div>
    );
  }

  if (msg.type === "error") {
    return (
      <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive max-w-[85%]">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>{msg.text}</span>
      </div>
    );
  }

  if (msg.type === "question") {
    return (
      <div className="flex justify-start">
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%] text-foreground whitespace-pre-wrap">
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === "entry") {
    return <EntryCard entry={msg.entry} isSaving={isSaving} onSave={onSave} onEdit={onEdit} onStartOver={onStartOver} defaultSplitPercentage={defaultSplitPercentage} />;
  }

  return null;
}

// ─── EntryCard ────────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: ParsedEntry;
  isSaving: boolean;
  onSave: (entry: ParsedEntry) => void;
  onEdit: () => void;
  onStartOver: () => void;
  defaultSplitPercentage: number;
}

function EntryCard({ entry, isSaving, onSave, onEdit, onStartOver, defaultSplitPercentage }: EntryCardProps) {
  const grossSales = entry.grossSales ?? 0;
  const activePercentage = entry.splitPercentage ?? defaultSplitPercentage;
  const saleResult = createWeeklySale({
    grossSales,
    primaryExpenses: entry.expenses,
    primarySplitPercentage: activePercentage,
  });
  
  const primaryShare = saleResult.success ? saleResult.data.primaryShare : 0;
  const secondaryShare = saleResult.success ? saleResult.data.secondaryShare : 0;
  const primaryNetRevenue = saleResult.success ? saleResult.data.primaryNetRevenue : 0;
  const resolvedDate = entry.date ? new Date(entry.date) : new Date();

  // Only show Save/Edit when all follow-ups are answered (entry card is final when shown with no question after it)
  return (
    <div className="flex flex-col gap-2 max-w-[90%]">
      <div className="flex items-center gap-2 text-xs font-medium text-primary">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Got it! Here&apos;s what I recorded:
      </div>

      <div className="rounded-xl border bg-muted/40 divide-y divide-border text-sm">
        <Row label="Date" value={resolvedDate.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} />
        <Row label="Gross Sales" value={formatCurrency(grossSales)} highlight />
        {activePercentage < 100 && (
          <>
            <Row label={`Owner Share (${activePercentage}%)`} value={formatCurrency(primaryShare)} />
            <Row label={`Partner Share (${100 - activePercentage}%)`} value={formatCurrency(secondaryShare)} />
          </>
        )}
        <Row
          label={activePercentage === 100 ? "Expenses" : "Owner Expenses"}
          value={`${formatCurrency(entry.expenses)}${entry.expenseType ? ` — ${entry.expenseType}` : ""}`}
        />
        <Row label={activePercentage === 100 ? "Net Revenue" : "Owner Net Revenue"} value={formatCurrency(primaryNetRevenue)} highlight />
        {entry.notes ? <Row label="Notes" value={entry.notes} /> : null}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => onSave(entry)}
          disabled={isSaving || !entry.isComplete}
        >
          {isSaving ? <><Loader2 data-icon="inline-start" className="animate-spin" />Saving…</> : "Save Entry"}
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} disabled={isSaving}>
          <Pencil data-icon="inline-start" />
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={onStartOver} disabled={isSaving}>
          <RotateCcw data-icon="inline-start" />
          Start Over
        </Button>
      </div>
    </div>
  );
}


// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between px-4 py-2 gap-4">
      <span className="text-muted-foreground shrink-0 text-xs">{label}</span>
      <span className={`text-xs text-right ${highlight ? "font-semibold text-foreground" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── ChatInput ────────────────────────────────────────────────────────────────

interface ChatInputProps {
  onSend: (text: string) => void;
  isWaiting: boolean;
  isSaving: boolean;
  activePendingQ: PendingQuestion;
}

function ChatInput({ onSend, isWaiting, isSaving, activePendingQ }: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = inputText.trim().length > 0 && !isWaiting && !isSaving;

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    onSend(inputText.trim());
    setInputText("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activePendingQ === "ask_sales"
              ? "Enter your sales amount…"
              : activePendingQ === "confirm_no_expense"
                ? "Type 'no' or enter your expenses…"
                : activePendingQ === "expense_type"
                  ? "What was the expense for?"
                  : activePendingQ === "notes"
                    ? "Add a note, or type 'skip'…"
                    : "Type your sales — press Enter to send…"
          }
          disabled={isWaiting || isSaving}
          rows={2}
          className="flex-1 resize-none text-sm"
          autoFocus
          aria-label="Your sales prompt"
        />
        <Button
          type="submit"
          size="icon"
          className="h-[60px] w-10 shrink-0"
          disabled={!canSend}
          aria-label="Send message"
        >
          {isWaiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      <p className="text-[11px] text-muted-foreground mt-2 ml-1">
        Enter to send · Shift+Enter for new line
      </p>
    </>
  );
}
