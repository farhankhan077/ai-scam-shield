"use client";
import { Transaction } from "@/lib/api";
import { AlertTriangle, Clock, ArrowUpRight } from "lucide-react";

interface AlertQueueViewProps {
  transactions: Transaction[];
  onSelect: (tx: Transaction) => void;
}

export default function AlertQueueView({ transactions, onSelect }: AlertQueueViewProps) {
  const alerts = transactions.filter((tx) => tx.risk_level === "Critical" || tx.risk_level === "Medium");

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-main">Alert Queue</h2>
        <p className="text-sm text-text-muted mt-1">
          Showing {alerts.length} high-priority alerts requiring review.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-60">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p>No active alerts.</p>
          </div>
        ) : (
          alerts.map((tx) => (
            <div
              key={tx.transaction_id}
              onClick={() => onSelect(tx)}
              className="bg-panel border border-border-main rounded-xl p-5 cursor-pointer hover:border-indigo-500/50 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.risk_level === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-main text-lg">${tx.amount.toLocaleString()}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.risk_level === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {tx.risk_level.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-text-muted mt-1">
                      <span className="font-semibold">{tx.sender_name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{tx.beneficiary_name}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-text-muted flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" /> Just now
                  </p>
                  <p className="text-xs font-mono text-text-muted mt-2 opacity-50">
                    ID: {tx.transaction_id.slice(0, 8)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border-main flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span>Velocity: <strong className="text-text-main">{tx.velocity_1hr}/hr</strong></span>
                  <span>Acct Age: <strong className="text-text-main">{tx.time_since_account_creation_days}d</strong></span>
                  {tx.is_new_beneficiary && <span className="text-orange-500 font-semibold">New Beneficiary</span>}
                </div>
                <button className="text-xs font-semibold text-indigo-500 group-hover:text-indigo-400 transition-colors">
                  Open Copilot &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
