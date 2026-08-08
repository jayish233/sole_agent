"""Select curriculum days to cover for a personalized interview."""

from __future__ import annotations

from typing import Any

from app.config import settings


def plan_interview_days(candidate: dict[str, Any], min_days: int | None = None) -> list[int]:
    """Pick distinct curriculum days to probe, biased by learning signals.

    Priority:
    1. High-attempt passed missions (struggle → deeper probing)
    2. Core AI topics that passed cleanly (embeddings, RAG, agents, MCP, deploy)
    3. Skipped topics (light conceptual check, not punitive)
    4. Fill from remaining passed missions
    """
    need = min_days or settings.min_curriculum_days
    missions = candidate.get("missions", [])

    hard = sorted(
        [m for m in missions if m.get("passed") and int(m.get("attempts", 1)) >= 3],
        key=lambda m: int(m.get("attempts", 1)),
        reverse=True,
    )
    core_days = {7, 8, 10, 11, 12, 21, 22, 23, 28}
    core = [m for m in missions if m.get("passed") and int(m["day"]) in core_days]
    skipped = [m for m in missions if m.get("skipped")]
    passed = [m for m in missions if m.get("passed")]

    selected: list[int] = []
    seen: set[int] = set()

    def add_from(items: list[dict[str, Any]]) -> None:
        for m in items:
            day = int(m["day"])
            if day in seen:
                continue
            seen.add(day)
            selected.append(day)
            if len(selected) >= need:
                return

    add_from(hard)
    if len(selected) < need:
        add_from(core)
    if len(selected) < need:
        add_from(passed)
    if len(selected) < need:
        # Still short — include skipped as conceptual probes
        add_from(skipped)

    # Absolute fallback for sparse profiles
    if len(selected) < need:
        for day in (7, 11, 12, 22, 23, 28):
            if day not in seen:
                selected.append(day)
                seen.add(day)
            if len(selected) >= need:
                break

    return selected[: max(need, len(selected))]
