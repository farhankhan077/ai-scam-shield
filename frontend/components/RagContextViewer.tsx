"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, FileText, ExternalLink } from "lucide-react";

interface ContextDoc {
  source: string;
  excerpt: string;
}

interface RagContextViewerProps {
  docs: ContextDoc[];
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  "fraud_patterns.txt": { bg: "bg-red-500/10", text: "text-red-400", icon: "🔴" },
  "fednow_risk_rules.txt": { bg: "bg-blue-500/10", text: "text-blue-400", icon: "🔵" },
  "scam_case_studies.txt": { bg: "bg-yellow-500/10", text: "text-yellow-400", icon: "🟡" },
  "remediation_playbook.txt": { bg: "bg-green-500/10", text: "text-green-400", icon: "🟢" },
  "regulatory_guidance.txt": { bg: "bg-violet-500/10", text: "text-violet-400", icon: "🟣" },
};

function getSourceStyle(source: string) {
  return SOURCE_COLORS[source] ?? { bg: "bg-slate-500/10", text: "text-slate-400", icon: "⚪" };
}

export default function RagContextViewer({ docs }: RagContextViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [openDoc, setOpenDoc] = useState<number | null>(null);

  if (!docs || docs.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-main overflow-hidden">
      {/* Header toggle */}
      <button
        id="rag-context-toggle"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-panel-hover hover:bg-background transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-text-main">RAG Retrieved Context</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-bold">
            {docs.length} docs
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Docs */}
      {expanded && (
        <div className="divide-y divide-border-main">
          {docs.map((doc, i) => {
            const style = getSourceStyle(doc.source);
            const isOpen = openDoc === i;
            return (
              <div key={i} className="bg-panel">
                <button
                  id={`rag-doc-${i}`}
                  onClick={() => setOpenDoc(isOpen ? null : i)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-panel-hover transition-colors"
                >
                  <span className="text-sm">{style.icon}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-slate-500" />
                      <span className={`text-[11px] font-semibold ${style.text}`}>{doc.source}</span>
                    </div>
                    {!isOpen && (
                      <p className="text-[10px] text-slate-600 mt-0.5 truncate">{doc.excerpt}</p>
                    )}
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </button>

                {isOpen && (
                  <div className={`mx-3 mb-2.5 p-3 rounded-lg border ${style.bg} border-opacity-30 border-current`}>
                    <p className="text-[11px] leading-relaxed text-text-main italic">
                      &ldquo;{doc.excerpt}&rdquo;
                    </p>
                    <p className={`text-[9px] font-semibold mt-1.5 uppercase tracking-wider ${style.text}`}>
                      Source: {doc.source}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      {expanded && (
        <div className="px-4 py-2 bg-background border-t border-border-main">
          <p className="text-[9px] text-text-muted">
            Retrieved via ChromaDB · text-embedding-004 · similarity search k=3
          </p>
        </div>
      )}
    </div>
  );
}
