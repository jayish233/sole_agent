"""ChromaDB vector store wrapper with local sentence-transformer embeddings."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

try:
    import chromadb
    from chromadb.utils import embedding_functions
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

from app.config import settings

COLLECTION_NAME = "ai_cohort_interview"


class MockCollection:
    def __init__(self):
        self.chunks = {}  # id -> dict

    def count(self) -> int:
        return len(self.chunks)

    def upsert(self, ids: list[str], documents: list[str], metadatas: list[dict]) -> None:
        for doc_id, doc, meta in zip(ids, documents, metadatas):
            self.chunks[doc_id] = {
                "id": doc_id,
                "text": doc,
                "metadata": meta,
            }

    def get(self, ids: list[str], include: list[str] | None = None) -> dict[str, list]:
        found_ids = []
        found_docs = []
        found_metas = []
        for doc_id in ids:
            if doc_id in self.chunks:
                found_ids.append(doc_id)
                found_docs.append(self.chunks[doc_id]["text"])
                found_metas.append(self.chunks[doc_id]["metadata"])
        return {
            "ids": found_ids,
            "documents": found_docs,
            "metadatas": found_metas,
        }

    def query(
        self,
        query_texts: list[str],
        n_results: int = 6,
        where: dict[str, Any] | None = None,
        include: list[str] | None = None,
    ) -> dict[str, list]:
        query_text = query_texts[0].lower() if query_texts else ""
        query_words = set(query_text.split())

        scored_hits = []
        for doc_id, chunk in self.chunks.items():
            # Apply where filter
            if where:
                match = True
                for key, val in where.items():
                    # Handle basic equality or nested $and/$eq structures
                    if key == "$and":
                        for condition in val:
                            for c_key, c_val in condition.items():
                                target_val = c_val.get("$eq") if isinstance(c_val, dict) else c_val
                                if chunk["metadata"].get(c_key) != target_val:
                                    match = False
                                    break
                            if not match:
                                break
                    else:
                        target_val = val.get("$eq") if isinstance(val, dict) else val
                        if chunk["metadata"].get(key) != target_val:
                            match = False
                            break
                if not match:
                    continue

            # Calculate basic TF-IDF/overlap score
            doc_text = chunk["text"].lower()
            score = 0.0
            for word in query_words:
                if word in doc_text:
                    score += 1.0
            
            scored_hits.append((score, chunk))

        # Sort by score descending
        scored_hits.sort(key=lambda x: x[0], reverse=True)
        top_hits = scored_hits[:n_results]

        return {
            "ids": [[h[1]["id"] for h in top_hits]],
            "documents": [[h[1]["text"] for h in top_hits]],
            "metadatas": [[h[1]["metadata"] for h in top_hits]],
            "distances": [[1.0 - (h[0] / max(1, len(query_words))) for h in top_hits]],
        }


class VectorStore:
    def __init__(self, persist_dir: str | None = None, embedding_model: str | None = None):
        self.persist_dir = str(persist_dir or settings.chroma_dir)
        self.embedding_model = embedding_model or settings.embedding_model
        
        if CHROMA_AVAILABLE:
            try:
                self._client = chromadb.PersistentClient(path=self.persist_dir)
                self._ef = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name=self.embedding_model
                )
                self._collection = self._client.get_or_create_collection(
                    name=COLLECTION_NAME,
                    embedding_function=self._ef,
                    metadata={"hnsw:space": "cosine"},
                )
                self._fallback = False
            except Exception:
                self._fallback = True
        else:
            self._fallback = True

        if self._fallback:
            self._collection = MockCollection()
            # Automatically pre-populate memory store for error-free local demo
            self._populate_mock_store()

    def _populate_mock_store(self) -> None:
        try:
            from app.rag.chunking import build_all_chunks
            chunks = build_all_chunks(settings.curriculum_path, settings.candidates_path)
            self.upsert_chunks(chunks)
        except Exception as e:
            print(f"Warning: Failed to pre-populate mock vector store: {e}")

    @property
    def collection(self):
        return self._collection

    def reset(self) -> None:
        if not self._fallback:
            try:
                self._client.delete_collection(COLLECTION_NAME)
            except Exception:
                pass
            self._collection = self._client.get_or_create_collection(
                name=COLLECTION_NAME,
                embedding_function=self._ef,
                metadata={"hnsw:space": "cosine"},
            )
        else:
            self._collection = MockCollection()
            self._populate_mock_store()

    def upsert_chunks(self, chunks: list[dict[str, Any]], batch_size: int = 64) -> int:
        if not chunks:
            return 0

        if not self._fallback:
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i : i + batch_size]
                ids = [c["id"] for c in batch]
                documents = [c["text"] for c in batch]
                metadatas = [c["metadata"] for c in batch]
                self._collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
        else:
            ids = [c["id"] for c in chunks]
            documents = [c["text"] for c in chunks]
            metadatas = [c["metadata"] for c in chunks]
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
