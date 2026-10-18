"""
ai_chain.py — LangChain 0.3.x LCEL Chains for AI Scam Shield
Uses the modern LCEL (LangChain Expression Language) API.

Two chains:
  1. run_copilot_chain   → create_retrieval_chain for transaction explanation
  2. run_analyst_chat    → RunnableWithMessageHistory for multi-turn chat
"""

import os
import json
import logging
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI
from rag_engine import get_retriever

logger = logging.getLogger(__name__)

# ─── In-memory session store ──────────────────────────────────────────────────
_chat_histories: dict[str, ChatMessageHistory] = {}


def _get_llm(temperature: float = 0.2) -> ChatGoogleGenerativeAI:
    """Return Gemini 1.5 Flash via LangChain."""
    api_key = os.getenv("GOOGLE_API_KEY")
    return ChatGoogleGenerativeAI(
        # model="gemini-2.0-flash",
        model="gemini-3.6-flash",
        google_api_key=api_key,
        temperature=temperature,
    )


def _get_session_history(session_id: str) -> BaseChatMessageHistory:
    """Return or create ChatMessageHistory for a session."""
    if session_id not in _chat_histories:
        _chat_histories[session_id] = ChatMessageHistory()
    return _chat_histories[session_id]


# ─── Chain 1: Copilot Summary (RAG + Gemini via LCEL) ────────────────────────

COPILOT_SYSTEM_PROMPT = """You are a senior fraud analyst at a major US bank specializing in \
FedNow and RTP instant payment fraud detection.

Use the following retrieved context from the fraud knowledge base to analyze this transaction:

{context}

Based on the transaction data and the retrieved fraud knowledge, provide a comprehensive fraud \
risk analysis in the following JSON format. Return ONLY valid JSON with NO markdown fences:

{{
  "summary": "2-3 sentence narrative explaining why this transaction is suspicious",
  "flags": [
    "Specific flag 1 with exact values from the transaction",
    "Specific flag 2 with exact values from the transaction",
    "Specific flag 3 with exact values from the transaction"
  ],
  "recommended_action": "One of: Approve | Hold Funds | Escalate to Tier 2",
  "confidence": "One of: Low | Medium | High",
  "regulatory_note": "Relevant FinCEN/FedNow/CFPB guidance applicable to this specific case",
  "fraud_pattern_match": "Name of the closest matching fraud pattern from the knowledge base",
  "retrieved_context": [
    {{
      "source": "filename.txt",
      "excerpt": "Key sentence from the retrieved document most directly applicable"
    }}
  ]
}}"""

COPILOT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", COPILOT_SYSTEM_PROMPT),
    ("human", "{input}"),
])


def run_copilot_chain(transaction: dict) -> dict:
    """
    Run the RAG copilot chain on a transaction using LangChain 0.3.x LCEL.
    Returns parsed dict with summary, flags, recommended_action, etc.
    """
    retriever = get_retriever()
    llm = _get_llm(temperature=0.1)

    # Build LCEL chain: retriever → combine_docs → LLM
    combine_docs_chain = create_stuff_documents_chain(llm, COPILOT_PROMPT)
    rag_chain = create_retrieval_chain(retriever, combine_docs_chain)

    # Format transaction as readable input
    tx_str = (
        f"Transaction ID: {transaction.get('transaction_id', 'N/A')}\n"
        f"Amount: ${transaction.get('amount', 0):,.2f}\n"
        f"Sender: {transaction.get('sender_name', 'Unknown')}\n"
        f"Beneficiary: {transaction.get('beneficiary_name', 'Unknown')}\n"
        f"Beneficiary Bank: {transaction.get('beneficiary_bank', 'Unknown')}\n"
        f"Is New Beneficiary: {transaction.get('is_new_beneficiary', False)}\n"
        f"Velocity (last 1hr): {transaction.get('velocity_1hr', 0)} transactions\n"
        f"Sender Account Age: {transaction.get('time_since_account_creation_days', 0)} days\n"
        f"Transaction Type: {transaction.get('transaction_type', 'Unknown')}\n"
        f"Channel: {transaction.get('channel', 'Unknown')}\n"
        f"Risk Score: {transaction.get('risk_score', 'Not yet scored')}\n"
        f"Risk Level: {transaction.get('risk_level', 'Unknown')}"
    )

    result = rag_chain.invoke({"input": tx_str})
    raw_answer = result.get("answer", "{}")
    source_docs = result.get("context", [])

    # Parse JSON response
    try:
        clean = raw_answer.strip()
        if "```" in clean:
            parts = clean.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                try:
                    return _enrich_with_sources(json.loads(part), source_docs)
                except json.JSONDecodeError:
                    continue
        parsed = json.loads(clean)
    except json.JSONDecodeError:
        logger.warning("LLM returned non-JSON; using fallback structure")
        parsed = {
            "summary": raw_answer[:500] if raw_answer else "Analysis unavailable",
            "flags": ["AI analysis could not be parsed — check API key"],
            "recommended_action": "Escalate to Tier 2",
            "confidence": "Low",
            "regulatory_note": "Manual review required",
            "fraud_pattern_match": "Unknown",
            "retrieved_context": [],
        }

    return _enrich_with_sources(parsed, source_docs)


def _enrich_with_sources(parsed: dict, source_docs: list) -> dict:
    """Add source document excerpts if the LLM didn't include them."""
    if not parsed.get("retrieved_context") and source_docs:
        parsed["retrieved_context"] = [
            {
                "source": doc.metadata.get("source", "unknown"),
                "excerpt": doc.page_content[:200].strip(),
            }
            for doc in source_docs[:3]
        ]
    return parsed


# ─── Chain 2: Analyst Chat (RunnableWithMessageHistory) ──────────────────────

ANALYST_CHAT_SYSTEM = (
    "You are an expert AI fraud analyst assistant for an instant payments risk team. "
    "You have access to a knowledge base of fraud patterns, FedNow/RTP rules, case studies, "
    "and remediation playbooks. Answer concisely and cite specific rules or patterns. "
    "Always end with an actionable recommendation.\n\n"
    "Current transaction under review:\n{transaction_context}"
)

ANALYST_CHAT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", ANALYST_CHAT_SYSTEM),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    ("system", "Relevant knowledge base context:\n{context}"),
])


def run_analyst_chat(session_id: str, transaction: dict, message: str) -> dict:
    """
    Run a conversational RAG chat turn using RunnableWithMessageHistory (LangChain 0.3.x).
    Maintains per-session chat history for multi-turn analysis.
    """
    retriever = get_retriever()
    llm = _get_llm(temperature=0.3)

    tx_context = (
        f"ID: {transaction.get('transaction_id', 'N/A')} | "
        f"Amount: ${transaction.get('amount', 0):,.2f} | "
        f"Sender: {transaction.get('sender_name')} | "
        f"Beneficiary: {transaction.get('beneficiary_name')} | "
        f"New Beneficiary: {transaction.get('is_new_beneficiary')} | "
        f"Velocity 1hr: {transaction.get('velocity_1hr')} | "
        f"Account Age: {transaction.get('time_since_account_creation_days')} days | "
        f"Risk Score: {transaction.get('risk_score', 'N/A')} | "
        f"Risk Level: {transaction.get('risk_level', 'N/A')}"
    )

    # Build LCEL chain with retrieval
    combine_docs_chain = create_stuff_documents_chain(llm, ANALYST_CHAT_PROMPT)
    rag_chain = create_retrieval_chain(retriever, combine_docs_chain)

    # Wrap with message history for multi-turn memory
    chain_with_history = RunnableWithMessageHistory(
        rag_chain,
        get_session_history=_get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    result = chain_with_history.invoke(
        {
            "input": message,
            "transaction_context": tx_context,
        },
        config={"configurable": {"session_id": session_id}},
    )

    answer = result.get("answer", "Unable to generate response.")
    source_docs = result.get("context", [])
    sources = list({doc.metadata.get("source", "unknown") for doc in source_docs})

    return {
        "answer": answer,
        "sources": sources,
        "session_id": session_id,
    }


def clear_session(session_id: str) -> None:
    """Clear chat history for a given session."""
    if session_id in _chat_histories:
        del _chat_histories[session_id]
