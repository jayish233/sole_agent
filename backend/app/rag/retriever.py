"""Personalized retrieval over curriculum + candidate chunks."""

from __future__ import annotations

from typing import Any

from app.config import settings
from app.rag.store import VectorStore, get_vector_store


class PersonalizedRetriever:
    def __init__(self, store: VectorStore | None = None):
        self.store = store or get_vector_store()

    def retrieve_for_candidate(
        self,
        candidate: dict[str, Any],
        query: str | None = None,
        focus_days: list[int] | None = None,
        top_k: int | None = None,
    ) -> list[dict[str, Any]]:
        """Retrieve curriculum/context tailored to a candidate's journey."""
        k = top_k or settings.retrieval_top_k
        member = candidate.get("member", {})
        missions = candidate.get("missions", [])
        signals = candidate.get("signals", {})

        days = focus_days or [
            int(m["day"]) for m in missions if m.get("passed") or m.get("skipped")
        ]
        hard_topics = [
            m["title"]
            for m in missions
            if m.get("passed") and int(m.get("attempts", 1)) >= 3
        ]
        skipped = [m["title"] for m in missions if m.get("skipped")]

        auto_query = query or (
            f"Technical interview topics for {member.get('jobRole', 'engineer')} "
            f"covering days {days}. Focus on: "
            f"{', '.join((hard_topics + skipped)[:6]) or 'RAG, agents, MCP, deployment'}. "
            f"Learning signals: {signals}."
        )

        # 1) Explicitly pull planned curriculum day chunks (guarantees coverage).
        hits: list[dict[str, Any]] = []
        seen_ids: set[str] = set()
        for day in days[:k]:
            for hit in self.retrieve_day(day):
                if hit["id"] in seen_ids:
                    continue
                seen_ids.add(hit["id"])
                hits.append(hit)

        # 2) Semantic fill from curriculum (and broad search as fallback).
        semantic: list[dict[str, Any]] = []
        try:
            semantic = self.store.query(
                auto_query,
                n_results=k,
                where={"source": "curriculum"},
            )
        except Exception:
            semantic = []

        if not semantic:
            semantic = self.store.query(auto_query, n_results=k)

        for hit in semantic:
            if hit["id"] in seen_ids:
                continue
            seen_ids.add(hit["id"])
            hits.append(hit)

        return hits[:k]

    def retrieve_day(self, day: int) -> list[dict[str, Any]]:
        # Exact id lookup is more reliable than metadata where-filters.
        try:
            got = self.store.collection.get(
                ids=[f"curriculum-day-{day}"],
                include=["documents", "metadatas"],
            )
            if got.get("ids"):
                return [
                    {
                        "id": got["ids"][0],
                        "text": (got.get("documents") or [""])[0],
                        "metadata": (got.get("metadatas") or [{}])[0] or {},
                        "distance": 0.0,
                    }
                ]
        except Exception:
            pass

        return self.store.query(
            f"curriculum day {day} learning objectives tools",
            n_results=1,
            where={"$and": [{"source": {"$eq": "curriculum"}}, {"day": {"$eq": day}}]},
        )

    def format_context(self, hits: list[dict[str, Any]]) -> str:
        if not hits:
            return "No retrieved curriculum context."
        blocks = []
        for i, hit in enumerate(hits, start=1):
            meta = hit.get("metadata", {})
            title = meta.get("title") or meta.get("name") or hit.get("id")
            source = meta.get("source", "unknown")
            day = meta.get("day")
            header = f"[{i}] ({source}" + (f", day {day}" if day else "") + f") {title}"
            blocks.append(f"{header}\n{hit.get('text', '').strip()}")
        return "\n\n---\n\n".join(blocks)
