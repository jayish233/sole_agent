"""Ingest curriculum.json + candidates.json into ChromaDB.

Usage (from backend/):
    python -m app.rag.ingest
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow `python -m app.rag.ingest` from backend/
if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.config import settings
from app.rag.chunking import build_all_chunks
from app.rag.store import VectorStore


def ingest(reset: bool = True) -> dict[str, int | str]:
    curriculum_path = settings.curriculum_path
    candidates_path = settings.candidates_path

    if not curriculum_path.exists():
        raise FileNotFoundError(f"Missing curriculum: {curriculum_path}")
    if not candidates_path.exists():
        raise FileNotFoundError(f"Missing candidates: {candidates_path}")

    chunks = build_all_chunks(curriculum_path, candidates_path)
    store = VectorStore()
    if reset:
        store.reset()

    count = store.upsert_chunks(chunks)
    curriculum_count = sum(1 for c in chunks if c["metadata"].get("source") == "curriculum")
    candidate_count = sum(1 for c in chunks if c["metadata"].get("source") == "candidate")

    return {
        "total_chunks": count,
        "curriculum_chunks": curriculum_count,
        "candidate_chunks": candidate_count,
        "chroma_dir": str(settings.chroma_dir),
        "embedding_model": settings.embedding_model,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest cohort data into Chroma for RAG")
    parser.add_argument(
        "--no-reset",
        action="store_true",
        help="Upsert without deleting the existing collection",
    )
    args = parser.parse_args()

    summary = ingest(reset=not args.no_reset)
    print("RAG ingest complete")
    for key, value in summary.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
