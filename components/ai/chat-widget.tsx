"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ChatInput = ({ 
  onSend, 
  isLoading, 
  isRateLimited 
}: { 
  onSend: (text: string) => void; 
  isLoading: boolean; 
  isRateLimited: boolean 
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t bg-muted/50 flex gap-2">
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isRateLimited ? "Rate limit reached. Please wait..." : "Ask anything..."}
        className="flex-1 bg-background"
        disabled={isRateLimited}
      />
      <Button
        type="submit"
        size="icon"
        disabled={isLoading || !input.trim() || isRateLimited}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, status, error, sendMessage, clearError } = useChat();

  const isLoading = status === 'submitted' || status === 'streaming';
  const isRateLimited = error?.message?.toLowerCase().includes("too many requests") || false;

  const handleSend = (text: string) => {
    sendMessage({
      role: 'user',
      content: text,
      parts: [{ type: 'text', text }]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-background border rounded-lg shadow-xl flex flex-col w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[80vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center rounded-t-lg">
            <h3 className="font-semibold">Split AI</h3>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-75" aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm mt-4">
                Ask me about your sales!
              </div>
            ) : (
              messages.map(m => <ChatMessage key={m.id} message={m as unknown as import("@/lib/utils/chat").UIMessage} />)
            )}
            {isLoading && (
              <div className="text-sm text-muted-foreground animate-pulse"><Loader2 className="animate-spin" /></div>
            )}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 break-words flex flex-col gap-2">
                <div><span className="font-semibold">Error:</span> {error.message}</div>
                {isRateLimited && (
                  <Button variant="outline" size="sm" onClick={() => clearError?.()} className="self-start mt-1">
                    Try Again
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <ChatInput onSend={handleSend} isLoading={isLoading} isRateLimited={isRateLimited} />
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
