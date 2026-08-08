"""ChromaDB vector store wrapper with local sentence-transformer embeddings."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import chromadb
from chromadb.utils import embedding_functions

from app.config import settings

COLLECTION_NAME = "ai_cohort_interview"


class VectorStore:
    def __init__(self, persist_dir: str | None = None, embedding_model: str | None = None):
        self.persist_dir = str(persist_dir or settings.chroma_dir)
        self.embedding_model = embedding_model or settings.embedding_model
        self._client = chromadb.PersistentClient(path=self.persist_dir)
        self._ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=self.embedding_model
        )
        self._collection = self._client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=self._ef,
            metadata={"hnsw:space": "cosine"},
        )

    @property
    def collection(self):
        return self._collection

    def reset(self) -> None:
        try:
            self._client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass
        self._collection = self._client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=self._ef,
            metadata={"hnsw:space": "cosine"},
        )

    def upsert_chunks(self, chunks: list[dict[str, Any]], batch_size: int = 64) -> int:
        if not chunks:
            return 0

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            ids = [c["id"] for c in batch]
            documents = [c["text"] for c in batch]
            metadatas = [c["metadata"] for c in batch]
            self._collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

        return len(chunks)

    def count(self) -> int:
        return self._collection.count()

    def query(
        self,
        query_text: str,
        n_results: int = 6,
        where: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        kwargs: dict[str, Any] = {
            "query_texts": [query_text],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        result = self._collection.query(**kwargs)
        hits: list[dict[str, Any]] = []
        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        dists = result.get("distances", [[]])[0]
        ids = result.get("ids", [[]])[0]

        for doc, meta, dist, doc_id in zip(docs, metas, dists, ids):
            hits.append(
                {
                    "id": doc_id,
                    "text": doc,
                    "metadata": meta or {},
                    "distance": dist,
                }
            )
        return hits


@lru_cache(maxsize=1)
def get_vector_store() -> VectorStore:
    return VectorStore()
