import { User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UIMessage } from "@/lib/utils/chat";

interface ChatMessageProps {
  message: UIMessage;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="mr-2 mt-0.5 size-8">
          <AvatarFallback className="bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`flex flex-col space-y-2 overflow-hidden px-4 py-3 shadow-sm rounded-lg max-w-[85%] ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground border"
        }`}
      >
        {(() => {
          const partsArray = message.parts as { type: string; text?: string }[] | undefined;
          const text = message.text || message.content || (partsArray && partsArray.find((p) => p.type === 'text')?.text);
          const hasTools = (message.toolInvocations && message.toolInvocations.length > 0) || (partsArray && partsArray.some((p) => p.type === 'tool-invocation'));
          
          return (
            <>
              {text && (
                <div className="text-sm break-words">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => { void node; return <p className="mb-3 last:mb-0 leading-relaxed" {...props} /> },
                      ul: ({ node, ...props }) => { void node; return <ul className="list-disc pl-6 mb-3 space-y-1" {...props} /> },
                      ol: ({ node, ...props }) => { void node; return <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} /> },
                      li: ({ node, ...props }) => { void node; return <li className="leading-relaxed" {...props} /> },
                      strong: ({ node, ...props }) => { void node; return <strong className="font-semibold" {...props} /> },
                      h1: ({ node, ...props }) => { void node; return <h1 className="text-lg font-bold mb-2 mt-4" {...props} /> },
                      h2: ({ node, ...props }) => { void node; return <h2 className="text-md font-bold mb-2 mt-3" {...props} /> },
                      h3: ({ node, ...props }) => { void node; return <h3 className="text-base font-semibold mb-2 mt-3" {...props} /> }
                    }}
                  >
                    {text}
                  </ReactMarkdown>
                </div>
              )}
              {hasTools && !text && (
                <div className="flex items-center gap-2 text-muted-foreground/80 italic">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching sales data...
                </div>
              )}
            </>
          );
        })()}
      </div>

      {isUser && (
        <Avatar className="ml-2 mt-0.5 size-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
