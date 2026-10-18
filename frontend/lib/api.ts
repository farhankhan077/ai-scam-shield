// /** API helpers for AI Scam Shield */

// const API_BASE = "http://localhost:8000";

// export interface Transaction {
//   transaction_id: string;
//   amount: number;
//   sender_name: string;
//   sender_account_id: string;
//   beneficiary_name: string;
//   beneficiary_bank: string;
//   is_new_beneficiary: boolean;
//   velocity_1hr: number;
//   time_since_account_creation_days: number;
//   transaction_type: string;
//   channel: string;
//   risk_score: number;
//   risk_level: "Safe" | "Medium" | "Critical";
// }

// export interface CopilotResult {
//   transaction_id: string;
//   risk_score: number;
//   risk_level: string;
//   summary: string;
//   flags: string[];
//   recommended_action: string;
//   confidence: string;
//   regulatory_note: string;
//   fraud_pattern_match: string;
//   retrieved_context: { source: string; excerpt: string }[];
// }

// export interface ChatResponse {
//   answer: string;
//   sources: string[];
//   session_id: string;
// }

// export async function fetchCopilotSummary(tx: Transaction): Promise<CopilotResult> {
//   const res = await fetch(`${API_BASE}/copilot_summary`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(tx),
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: "Unknown error" }));
//     throw new Error(err.detail || `HTTP ${res.status}`);
//   }
//   return res.json();
// }

// export async function fetchAnalystChat(
//   sessionId: string,
//   transaction: Transaction,
//   message: string
// ): Promise<ChatResponse> {
//   const res = await fetch(`${API_BASE}/analyst_chat`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ session_id: sessionId, transaction, message }),
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: "Unknown error" }));
//     throw new Error(err.detail || `HTTP ${res.status}`);
//   }
//   return res.json();
// }

// export async function clearChatSession(sessionId: string): Promise<void> {
//   await fetch(`${API_BASE}/analyst_chat/${sessionId}`, { method: "DELETE" });
// }

// export function subscribeToTransactions(
//   onTransaction: (tx: Transaction) => void,
//   onError: (err: Event) => void
// ): EventSource {
//   const es = new EventSource(`${API_BASE}/transactions`);
//   es.onmessage = (e) => {
//     try {
//       onTransaction(JSON.parse(e.data) as Transaction);
//     } catch {
//       // ignore malformed
//     }
//   };
//   es.onerror = onError;
//   return es;
// }




























































































/** API helpers for AI Scam Shield */

const API_BASE = "http://localhost:8000";

export interface Transaction {
  transaction_id: string;
  amount: number;
  sender_name: string;
  sender_account_id: string;
  beneficiary_name: string;
  beneficiary_bank: string;
  is_new_beneficiary: boolean;
  velocity_1hr: number;
  time_since_account_creation_days: number;
  transaction_type: string;
  channel: string;
  risk_score: number;
  risk_level: "Safe" | "Medium" | "Critical";
  source?: "auto" | "manual";
}

export interface CopilotResult {
  transaction_id: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  flags: string[];
  recommended_action: string;
  confidence: string;
  regulatory_note: string;
  fraud_pattern_match: string;
  retrieved_context: { source: string; excerpt: string }[];
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  session_id: string;
}

export interface ManualTransactionInput {
  transaction_id?: string;
  amount: number;
  sender_name: string;
  beneficiary_name: string;
  beneficiary_bank?: string;
  is_new_beneficiary: boolean;
  velocity_1hr: number;
  time_since_account_creation_days: number;
  transaction_type: string;
  channel: string;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
}

export async function fetchCopilotSummary(tx: Transaction): Promise<CopilotResult> {
  const res = await fetch(`${API_BASE}/copilot_summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAnalystChat(
  sessionId: string,
  transaction: Transaction,
  message: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/analyst_chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, transaction, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function clearChatSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/analyst_chat/${sessionId}`, { method: "DELETE" });
}

export async function submitManualTransaction(
  input: ManualTransactionInput
): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getAutoStreamStatus(): Promise<{ enabled: boolean }> {
  const res = await fetch(`${API_BASE}/transactions/auto/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function setAutoStreamEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
  const res = await fetch(`${API_BASE}/transactions/auto/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function subscribeToTransactions(
  onTransaction: (tx: Transaction) => void,
  onError: (err: Event) => void
): EventSource {
  const es = new EventSource(`${API_BASE}/transactions`);
  es.onmessage = (e) => {
    try {
      onTransaction(JSON.parse(e.data) as Transaction);
    } catch {
      // ignore malformed
    }
  };
  es.onerror = onError;
  return es;
}
