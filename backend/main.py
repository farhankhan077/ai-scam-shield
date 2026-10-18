"""
main.py — AI Scam Shield FastAPI Backend
Endpoints:
  GET  /health                       → RAG status check
  GET  /transactions                 → SSE stream of synthetic + manual transactions
  POST /transactions/manual          → Submit a hand-crafted transaction into the live stream
  POST /score_risk                   → Weighted rule-based risk scoring
  POST /copilot_summary              → LangChain RAG + Gemini explainability
  POST /analyst_chat                 → ConversationalRetrievalChain multi-turn chat
  DELETE /analyst_chat/{session_id}  → Clear chat memory
"""

import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from mock_stream import generate_transaction
from rag_engine import initialize_rag, get_doc_count
from ai_chain import run_copilot_chain, run_analyst_chat, clear_session
from ml_scorer import load_model, predict_risk, get_model_info, get_fired_explanation

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

# ─── Broadcast fan-out: every connected dashboard tab gets its own queue, so a
# manual transaction reaches ALL open tabs and can never be "stolen" by, or
# lost to, a connection that happens to be reconnecting at that moment. ─────
_subscribers: set["asyncio.Queue[dict]"] = set()


async def _broadcast(tx: dict) -> None:
    for q in list(_subscribers):
        q.put_nowait(tx)


# ─── Auto-stream toggle: pause the synthetic generator to isolate manual tests ──
auto_stream_enabled: bool = True

# ─── Startup: Initialize RAG ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Scam Shield backend...")

    logger.info("Loading XGBoost ML fraud detection model...")
    try:
        load_model()
    except FileNotFoundError:
        logger.error("❌ ML model not found — run: python train_model.py")
        logger.warning("Backend will run WITHOUT ML scoring — train model first!")
    except Exception as e:
        logger.error(f"❌ ML model load failed: {e}")

    logger.info("Initializing RAG engine (ChromaDB + Gemini Embeddings)...")
    try:
        count = initialize_rag()
        logger.info(f"✅ RAG engine ready — {count} chunks embedded in ChromaDB")
    except Exception as e:
        logger.error(f"❌ RAG engine initialization failed: {e}")
        logger.warning("Backend will run with limited AI capabilities")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="AI Scam Shield",
    description="Real-time AI fraud prevention for instant payments (FedNow/RTP)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class TransactionPayload(BaseModel):
    transaction_id: str
    amount: float
    sender_name: str
    sender_account_id: str | None = None
    beneficiary_name: str
    beneficiary_bank: str | None = None
    is_new_beneficiary: bool
    velocity_1hr: int
    time_since_account_creation_days: int
    transaction_type: str | None = None
    channel: str | None = None
    risk_score: int | None = None
    risk_level: str | None = None


class ManualTransactionRequest(BaseModel):
    """
    Schema for the 'Submit a transaction' demo form.
    Includes the PaySim balance fields (oldbalanceOrg / newbalanceOrig /
    oldbalanceDest / newbalanceDest) because balance_zeroed and
    amount_to_balance_ratio are ~93% of the model's decision weight combined
    (see model_metadata.json). Without them the model is scoring blind.
    """
    transaction_id: str | None = None
    amount: float
    sender_name: str
    beneficiary_name: str
    beneficiary_bank: str | None = None
    is_new_beneficiary: bool = False
    velocity_1hr: int = 1
    time_since_account_creation_days: int = 365
    transaction_type: str = "P2P"
    channel: str = "Web"
    oldbalanceOrg: float = 0.0
    newbalanceOrig: float = 0.0
    oldbalanceDest: float = 0.0
    newbalanceDest: float = 0.0


class AutoStreamToggle(BaseModel):
    enabled: bool


class AnalystChatRequest(BaseModel):
    session_id: str
    transaction: dict[str, Any]
    message: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": "Scam Shield V2",
        "ml_scorer": {
            "status": "active",
            "model": "XGBoostClassifier",
            "roc_auc": 0.9984,
            "f1_score": 0.9915,
            "top_features": [
                "balance_zeroed (57.88%)",
                "amount_to_balance_ratio (34.58%)",
                "log_amount (3.61%)"
            ]
        },
        "copilot": {
            "llm": "Gemini 2.0 Flash",
            "embeddings": "models/gemini-embedding-2",
            "vector_store": "ChromaDB"
        }
    }


@app.get("/transactions")
async def stream_transactions():
    """
    SSE endpoint — streams a synthetic transaction roughly every 1.5 seconds,
    OR a manually-submitted transaction the instant it's posted, whichever
    comes first. Each connection gets its own private queue (see _subscribers)
    so a manual submission reaches every open tab and can't be lost to a
    connection that's mid-reconnect.
    """
    queue: "asyncio.Queue[dict]" = asyncio.Queue()
    _subscribers.add(queue)
    logger.info(f"Dashboard connected — {len(_subscribers)} active listener(s)")

    async def event_generator():
        try:
            while True:
                try:
                    tx = await asyncio.wait_for(queue.get(), timeout=1.5)
                except asyncio.TimeoutError:
                    if not auto_stream_enabled:
                        # Nothing to send this tick — a heartbeat comment keeps
                        # the connection alive and visibly "open" while paused.
                        yield ": keep-alive\n\n"
                        continue
                    tx = generate_transaction()
                    score, level = predict_risk(tx)
                    tx["risk_score"] = score
                    tx["risk_level"] = level
                    tx["source"] = "auto"

                yield f"data: {json.dumps(tx)}\n\n"
        finally:
            _subscribers.discard(queue)
            logger.info(f"Dashboard disconnected — {len(_subscribers)} active listener(s)")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/transactions/auto/status")
async def get_auto_stream_status():
    """Current on/off state of the synthetic transaction generator."""
    return {"enabled": auto_stream_enabled}


@app.post("/transactions/auto/toggle")
async def toggle_auto_stream(payload: AutoStreamToggle):
    """
    Turn the synthetic transaction generator on or off. Useful for isolating
    manual test transactions on the dashboard without auto-stream noise.
    Manual submissions still flow through instantly either way.
    """
    global auto_stream_enabled
    auto_stream_enabled = payload.enabled
    logger.info(f"Auto transaction stream {'resumed' if payload.enabled else 'paused'}")
    return {"enabled": auto_stream_enabled}


@app.post("/transactions/manual")
async def submit_manual_transaction(payload: ManualTransactionRequest):
    """
    Score a hand-crafted demo transaction and push it into the live SSE
    stream so it shows up in the dashboard exactly like an auto-generated one.
    Returns the scored transaction immediately so the form can show a result
    without waiting for the stream round-trip.
    """
    tx = payload.model_dump()
    tx["transaction_id"] = tx.get("transaction_id") or str(uuid.uuid4())
    tx["sender_account_id"] = f"ACC-MANUAL-{tx['transaction_id'][:6].upper()}"
    tx["source"] = "manual"

    score, level = predict_risk(tx)
    tx["risk_score"] = score
    tx["risk_level"] = level

    await _broadcast(tx)
    return tx


@app.post("/score_risk")
async def score_risk(tx: TransactionPayload):
    """
    ML-based fraud risk scoring endpoint.
    Returns risk_score (0-100), risk_level, model_confidence, and top feature signals.
    """
    tx_dict = tx.model_dump()
    score, level = predict_risk(tx_dict)
    explanation  = get_fired_explanation(tx_dict)
    ml_info      = get_model_info()

    return {
        "transaction_id":   tx.transaction_id,
        "risk_score":       score,
        "risk_level":       level,
        "scoring_method":   "ML — " + ml_info.get("model_type", "XGBoost"),
        "model_roc_auc":    ml_info.get("roc_auc"),
        "model_explanation": explanation,
        "top_features":     ml_info.get("feature_importance", {}),
    }


@app.post("/copilot_summary")
async def copilot_summary(tx: TransactionPayload):
    """
    AI-powered explainability endpoint.
    Uses LangChain RetrievalQA chain with ChromaDB + Gemini.
    Retrieves relevant fraud patterns before generating explanation.
    """
    tx_dict = tx.model_dump()

    if tx_dict.get("risk_score") is None:
        score, level = predict_risk(tx_dict)
        tx_dict["risk_score"] = score
        tx_dict["risk_level"] = level

    try:
        result = run_copilot_chain(tx_dict)
        result["transaction_id"] = tx.transaction_id
        result["risk_score"] = tx_dict["risk_score"]
        result["risk_level"] = tx_dict["risk_level"]
        return result
    except Exception as e:
        logger.error(f"Copilot chain error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}. Ensure GOOGLE_API_KEY is set in .env",
        )


@app.post("/analyst_chat")
async def analyst_chat(request: AnalystChatRequest):
    """
    Conversational AI endpoint using LangChain ConversationalRetrievalChain.
    Maintains per-session chat history for multi-turn analysis.
    """
    try:
        result = run_analyst_chat(
            session_id=request.session_id,
            transaction=request.transaction,
            message=request.message,
        )
        return result
    except Exception as e:
        logger.error(f"Analyst chat error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}. Ensure GOOGLE_API_KEY is set in .env",
        )


@app.delete("/analyst_chat/{session_id}")
async def clear_chat_session(session_id: str):
    """Clear the chat memory for a given session."""
    clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
