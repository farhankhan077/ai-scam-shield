"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { fetchAnalystChat, Transaction } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

const SUGGESTED_QUESTIONS = [
  "Why is this transaction flagged?",
  "What fraud pattern does this match?",
  "What should I do with this transaction?",
  "What does the regulatory guidance say?",
];

interface AnalystChatProps {
  transaction: Transaction;
  sessionId: string;
}

export default function AnalystChat({ transaction, sessionId }: AnalystChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `I'm your AI fraud analyst. I've reviewed transaction **${transaction.transaction_id.slice(0, 12)}...** — ask me anything about it.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetchAnalystChat(sessionId, transaction, text);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.answer, sources: res.sources },
      ]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ Error: ${errorMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-64 rounded-xl border border-border-main overflow-hidden bg-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-main bg-panel-hover">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-text-main">Analyst Copilot</p>
          <p className="text-[9px] text-slate-500">Powered by Gemini · LangChain RAG</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "assistant" ? "bg-indigo-500/20" : "bg-slate-700"}`}>
              {msg.role === "assistant" ? (
                <Bot className="w-3 h-3 text-indigo-400" />
              ) : (
                <User className="w-3 h-3 text-slate-400" />
              )}
            </div>
            <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === "assistant" ? "bg-background text-text-main rounded-tl-none" : "bg-indigo-600/80 text-white rounded-tr-none"}`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-text-main" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <BookOpen className="w-2.5 h-2.5 text-slate-600" />
                  {msg.sources.map((s, si) => (
                    <span key={si} className="text-[9px] text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Bot className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="px-3 py-2 rounded-xl rounded-tl-none bg-background flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
              <span className="text-[11px] text-slate-500">Querying knowledge base...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="px-3 py-2 border-t border-border-main flex gap-1.5 overflow-x-auto">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              id={`suggested-q-${i}`}
              onClick={() => sendMessage(q)}
              className="flex-shrink-0 text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full hover:bg-indigo-500/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-2 border-t border-border-main">
        <input
          id="analyst-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about this transaction..."
          className="flex-1 bg-panel-hover border border-border-main rounded-lg px-3 py-2 text-xs text-text-main placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
        <button
          id="analyst-chat-send"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
