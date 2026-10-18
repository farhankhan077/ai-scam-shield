"use client";
import { Transaction } from "@/lib/api";
import { ArrowUpRight, Wifi, AlertOctagon, CheckCircle2, Clock } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  selectedId: string | null;
  onSelect: (tx: Transaction) => void;
}

function RiskBadge({ level, score }: { level: string; score: number }) {
  const cfg = {
    Safe: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: CheckCircle2 },
    Medium: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", icon: Clock },
    Critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", icon: AlertOctagon },
  }[level] ?? { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", icon: Clock };

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {level} · {score}
    </span>
  );
}

function rowBg(level: string, selected: boolean) {
  if (selected) {
    return {
      Safe: "bg-emerald-500/10 border-l-2 border-emerald-500",
      Medium: "bg-yellow-500/10 border-l-2 border-yellow-500",
      Critical: "bg-red-500/10 border-l-2 border-red-500",
    }[level] ?? "bg-blue-500/10 border-l-2 border-blue-500";
  }
  return {
    Safe: "hover:bg-emerald-500/5",
    Medium: "hover:bg-yellow-500/5",
    Critical: "hover:bg-red-500/5",
  }[level] ?? "hover:bg-slate-800/50";
}

export default function TransactionTable({ transactions, selectedId, onSelect }: TransactionTableProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-main">
        <div>
          <h1 className="text-lg font-bold text-text-main">Live Transaction Monitor</h1>
          <p className="text-xs text-slate-500 mt-0.5">FedNow / RTP — Real-time risk scoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-400/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>SSE Connected</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_100px_80px_80px_90px_110px] gap-3 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-border-main bg-panel">
        <span>Transaction</span>
        <span>Amount</span>
        <span>Velocity</span>
        <span>Acct Age</span>
        <span>New Bene</span>
        <span>Risk Level</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
            <Wifi className="w-8 h-8 animate-pulse" />
            <p className="text-sm">Waiting for transactions...</p>
          </div>
        ) : (
          transactions.map((tx, i) => {
            const isSelected = tx.transaction_id === selectedId;
            return (
              <div
                key={tx.transaction_id}
                id={`tx-row-${i}`}
                onClick={() => onSelect(tx)}
                className={`
                  grid grid-cols-[1fr_100px_80px_80px_90px_110px] gap-3 px-5 py-3 
                  border-b border-border-main/50 cursor-pointer transition-all duration-150
                  ${rowBg(tx.risk_level, isSelected)}
                  ${tx.risk_level === "Critical" ? "animate-pulse-once" : ""}
                `}
              >
                {/* Transaction info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-text-main truncate">{tx.sender_name}</p>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <p className="text-sm text-slate-400 truncate">{tx.beneficiary_name}</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{tx.transaction_id.slice(0, 12)}…</p>
                </div>

                {/* Amount */}
                <div className="flex items-center">
                  <span className={`text-sm font-bold ${tx.risk_level === "Critical" ? "text-red-500" : "text-text-main"}`}>
                    ${tx.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Velocity */}
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${tx.velocity_1hr >= 10 ? "text-red-400" : tx.velocity_1hr >= 5 ? "text-yellow-400" : "text-slate-400"}`}>
                    {tx.velocity_1hr}/hr
                  </span>
                </div>

                {/* Account age */}
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${tx.time_since_account_creation_days <= 14 ? "text-red-400" : tx.time_since_account_creation_days <= 30 ? "text-yellow-400" : "text-slate-400"}`}>
                    {tx.time_since_account_creation_days}d
                  </span>
                </div>

                {/* New beneficiary */}
                <div className="flex items-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.is_new_beneficiary ? "bg-orange-500/20 text-orange-400" : "bg-slate-700/50 text-slate-500"}`}>
                    {tx.is_new_beneficiary ? "⚠ NEW" : "Known"}
                  </span>
                </div>

                {/* Risk badge */}
                <div className="flex items-center">
                  <RiskBadge level={tx.risk_level} score={tx.risk_score} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
