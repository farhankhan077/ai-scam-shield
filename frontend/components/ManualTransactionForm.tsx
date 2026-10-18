"use client";
import { useState } from "react";
import { X, Send, Loader2, Zap, ShieldCheck, AlertOctagon } from "lucide-react";
import { ManualTransactionInput, submitManualTransaction } from "@/lib/api";

interface ManualTransactionFormProps {
  onClose: () => void;
  /** Called with the transaction_id right after a successful submit, so the
   *  parent can auto-open the Copilot panel once it arrives via the SSE stream. */
  onSubmitted: (transactionId: string) => void;
}

const SAFE_PRESET: ManualTransactionInput = {
  amount: 500,
  sender_name: "Alice Johnson",
  beneficiary_name: "Coffee & Co Merchant",
  beneficiary_bank: "Chase",
  is_new_beneficiary: false,
  velocity_1hr: 2,
  time_since_account_creation_days: 420,
  transaction_type: "P2P",
  channel: "Mobile App",
  oldbalanceOrg: 8000,
  newbalanceOrig: 7500,
  oldbalanceDest: 3000,
  newbalanceDest: 3500,
};

const FRAUD_PRESET: ManualTransactionInput = {
  amount: 25000,
  sender_name: "Michael Chen",
  beneficiary_name: "Unknown Beneficiary",
  beneficiary_bank: "Unknown Routing",
  is_new_beneficiary: true,
  velocity_1hr: 6,
  time_since_account_creation_days: 90,
  transaction_type: "Wire",
  channel: "API",
  oldbalanceOrg: 25200,
  newbalanceOrig: 0,
  oldbalanceDest: 0,
  newbalanceDest: 25000,
};

const TRANSACTION_TYPES = ["P2P", "Wire", "Business", "Payroll", "Bill Payment"];
const CHANNELS = ["Mobile App", "Web", "API"];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
      {hint && <span className="block text-[9px] text-slate-600 mt-0.5">{hint}</span>}
    </label>
  );
}

const inputClass =
  "mt-1 w-full bg-panel-hover border border-border-main rounded-lg px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

export default function ManualTransactionForm({ onClose, onSubmitted }: ManualTransactionFormProps) {
  const [form, setForm] = useState<ManualTransactionInput>(SAFE_PRESET);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ManualTransactionInput>(key: K, value: ManualTransactionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const transaction_id = crypto.randomUUID();
    try {
      await submitManualTransaction({ ...form, transaction_id });
      onSubmitted(transaction_id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit transaction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-panel border border-border-main rounded-2xl shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-main bg-background sticky top-0 z-10">
            <div>
              <h2 className="font-bold text-text-main text-sm">Submit a Transaction</h2>
              <p className="text-[10px] text-slate-500">Runs through the same live ML scoring pipeline</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-panel-hover text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(SAFE_PRESET)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-600/30 rounded-lg py-2 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Load Safe Example
              </button>
              <button
                type="button"
                onClick={() => setForm(FRAUD_PRESET)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/30 rounded-lg py-2 transition-colors"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Load Fraud Example
              </button>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sender Name">
                <input
                  className={inputClass}
                  value={form.sender_name}
                  onChange={(e) => update("sender_name", e.target.value)}
                  required
                />
              </Field>
              <Field label="Beneficiary Name">
                <input
                  className={inputClass}
                  value={form.beneficiary_name}
                  onChange={(e) => update("beneficiary_name", e.target.value)}
                  required
                />
              </Field>
              <Field label="Beneficiary Bank">
                <input
                  className={inputClass}
                  value={form.beneficiary_bank ?? ""}
                  onChange={(e) => update("beneficiary_bank", e.target.value)}
                />
              </Field>
              <Field label="New Beneficiary?">
                <select
                  className={inputClass}
                  value={form.is_new_beneficiary ? "yes" : "no"}
                  onChange={(e) => update("is_new_beneficiary", e.target.value === "yes")}
                >
                  <option value="no">No — known beneficiary</option>
                  <option value="yes">Yes — first time</option>
                </select>
              </Field>
            </div>

            {/* Transaction details */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount ($)">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) => update("amount", Number(e.target.value))}
                  required
                />
              </Field>
              <Field label="Transaction Type">
                <select
                  className={inputClass}
                  value={form.transaction_type}
                  onChange={(e) => update("transaction_type", e.target.value)}
                >
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Channel">
                <select
                  className={inputClass}
                  value={form.channel}
                  onChange={(e) => update("channel", e.target.value)}
                >
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Velocity (txns / hr)">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.velocity_1hr}
                  onChange={(e) => update("velocity_1hr", Number(e.target.value))}
                />
              </Field>
              <Field label="Sender Account Age (days)">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.time_since_account_creation_days}
                  onChange={(e) => update("time_since_account_creation_days", Number(e.target.value))}
                />
              </Field>
            </div>

            {/* Balances — the part that actually drives the model */}
            <div className="border-t border-border-main pt-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Account Balances — top ML signal
                </p>
              </div>
              <p className="text-[9px] text-slate-500 mb-3">
                balance_zeroed and amount_to_balance_ratio drive ~93% of the model&apos;s decision.
                Use the presets above for realistic values, or set your own to see the model react.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sender Balance — Before">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.oldbalanceOrg}
                    onChange={(e) => update("oldbalanceOrg", Number(e.target.value))}
                  />
                </Field>
                <Field label="Sender Balance — After">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.newbalanceOrig}
                    onChange={(e) => update("newbalanceOrig", Number(e.target.value))}
                  />
                </Field>
                <Field label="Beneficiary Balance — Before">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.oldbalanceDest}
                    onChange={(e) => update("oldbalanceDest", Number(e.target.value))}
                  />
                </Field>
                <Field label="Beneficiary Balance — After">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.newbalanceDest}
                    onChange={(e) => update("newbalanceDest", Number(e.target.value))}
                  />
                </Field>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Scoring..." : "Send Into Live Stream"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
