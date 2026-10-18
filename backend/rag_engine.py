"""
rag_engine.py — LangChain + ChromaDB RAG Engine
Embeds the fraud knowledge base into ChromaDB on first run.
Exposes a retriever used by ai_chain.py for all LLM calls.
"""

import os
import glob
import logging
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

load_dotenv()

logger = logging.getLogger(__name__)

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledge_base"
CHROMA_PERSIST_DIR = str(BASE_DIR / "chroma_db")
COLLECTION_NAME = "fraud_knowledge"

# ─── Globals (initialized once at startup) ───────────────────────────────────
_vectorstore: Chroma | None = None
_retriever = None


def _get_embeddings():
    """Return Google Gemini embeddings model."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY not set. Copy .env.template to .env and add your key."
        )
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-2",
        google_api_key=api_key,
    )


def _load_documents():
    """Load all .txt files from the knowledge base directory."""
    docs = []
    txt_files = glob.glob(str(KNOWLEDGE_BASE_DIR / "*.txt"))
    if not txt_files:
        raise FileNotFoundError(f"No .txt files found in {KNOWLEDGE_BASE_DIR}")

    for filepath in txt_files:
        loader = TextLoader(filepath, encoding="utf-8")
        loaded = loader.load()
        # Tag each document with its source filename for the RAG context viewer
        for doc in loaded:
            doc.metadata["source"] = Path(filepath).name
        docs.extend(loaded)
        logger.info(f"Loaded: {Path(filepath).name} ({len(loaded)} doc chunks)")

    return docs


def _chunk_documents(docs):
    """Split documents into chunks suitable for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n===", "\n---", "\n\n", "\n", " "],
    )
    chunks = splitter.split_documents(docs)
    logger.info(f"Split into {len(chunks)} chunks")
    return chunks


def initialize_rag():
    """
    Initialize the RAG engine:
    - If ChromaDB store exists with documents, load it (fast path).
    - If not, embed all knowledge base documents and persist (slow path, ~15s).
    """
    global _vectorstore, _retriever

    embeddings = _get_embeddings()

    # Check if persistent store already has data
    chroma_dir = Path(CHROMA_PERSIST_DIR)
    if (chroma_dir / "chroma.sqlite3").exists():
        logger.info("ChromaDB store found — loading existing embeddings (fast path)")
        _vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=embeddings,
            persist_directory=CHROMA_PERSIST_DIR,
        )
        count = _vectorstore._collection.count()
        if count > 0:
            logger.info(f"Loaded {count} chunks from ChromaDB")
            _retriever = _vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 3},
            )
            return count

    # First run — embed and persist
    logger.info("No existing ChromaDB store — embedding knowledge base (first run, ~15s)...")
    docs = _load_documents()
    chunks = _chunk_documents(docs)

    _vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        persist_directory=CHROMA_PERSIST_DIR,
    )

    count = len(chunks)
    logger.info(f"Embedded and persisted {count} chunks to ChromaDB")
    _retriever = _vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3},
    )
    return count


def get_retriever():
    """Return the initialized retriever. Must call initialize_rag() first."""
    if _retriever is None:
        raise RuntimeError("RAG engine not initialized. Call initialize_rag() first.")
    return _retriever


def get_vectorstore():
    """Return the initialized vectorstore."""
    if _vectorstore is None:
        raise RuntimeError("RAG engine not initialized. Call initialize_rag() first.")
    return _vectorstore


def get_doc_count() -> int:
    """Return the number of embedded document chunks."""
    if _vectorstore is None:
        return 0
    return _vectorstore._collection.count()
