"""Turn curriculum.json and candidates.json into retrieval-ready text chunks."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def _module_for_day(modules: list[dict[str, Any]], day: int) -> dict[str, Any] | None:
    for module in modules:
        start, end = module["days"]
        if start <= day <= end:
            return module
    return None


def chunk_curriculum(curriculum_path: Path) -> list[dict[str, Any]]:
    data = json.loads(curriculum_path.read_text(encoding="utf-8"))
    modules = data.get("modules", [])
    chunks: list[dict[str, Any]] = []

    # Cohort overview
    module_lines = [
        f"Module {m['n']}: {m['title']} (days {m['days'][0]}-{m['days'][1]})"
        for m in modules
    ]
    chunks.append(
        {
            "id": "curriculum-overview",
            "text": (
                f"Cohort: {data.get('cohort', 'AI Cohort')}\n"
                "Modules:\n" + "\n".join(module_lines)
            ),
            "metadata": {
                "source": "curriculum",
                "kind": "overview",
                "day": 0,
                "title": "Cohort Overview",
            },
        }
    )

    for day in data.get("days", []):
        day_num = int(day["day"])
        module = _module_for_day(modules, day_num)
        tools = ", ".join(day.get("tools", []))
        objectives = "\n".join(f"- {o}" for o in day.get("objectives", []))
        text = (
            f"Day {day_num}: {day['title']}\n"
            f"Type: {day.get('type', 'UNKNOWN')}\n"
            f"Module: {module['title'] if module else 'N/A'}\n"
            f"Tools: {tools}\n"
            f"Learning objectives:\n{objectives}"
        )
        chunks.append(
            {
                "id": f"curriculum-day-{day_num}",
                "text": text,
                "metadata": {
                    "source": "curriculum",
                    "kind": "day",
                    "day": day_num,
                    "title": day["title"],
                    "type": day.get("type", ""),
                    "module": module["title"] if module else "",
                },
            }
        )

    return chunks


def chunk_candidates(candidates_path: Path) -> list[dict[str, Any]]:
    data = json.loads(candidates_path.read_text(encoding="utf-8"))
    chunks: list[dict[str, Any]] = []

    for candidate in data.get("candidates", []):
        member = candidate.get("member", {})
        signals = candidate.get("signals", {})
        missions = candidate.get("missions", [])

        passed = [m for m in missions if m.get("passed")]
        skipped = [m for m in missions if m.get("skipped")]
        hard = [
            m
            for m in missions
            if m.get("passed") and int(m.get("attempts", 1)) >= 3
        ]

        mission_lines = []
        for m in missions:
            if m.get("skipped"):
                status = "SKIPPED"
            elif m.get("passed"):
                status = f"PASSED ({m.get('attempts', 1)} attempts)"
            else:
                status = "INCOMPLETE"
            mission_lines.append(f"- Day {m['day']}: {m['title']} — {status}")

        text = (
            f"Candidate {member.get('id')}: {member.get('name')}\n"
            f"Role: {member.get('jobRole')} | Experience: {member.get('yearsExperience')} years\n"
            f"Education: {member.get('education')} | Status: {member.get('status')}\n"
            f"Signals: commitDays={signals.get('commitDays')}, "
            f"missionsCompleted={signals.get('missionsCompleted')}, "
            f"missionsFirstTry={signals.get('missionsFirstTry')}\n"
            f"Passed missions ({len(passed)}): "
            + ", ".join(f"Day {m['day']}" for m in passed)
            + "\n"
            f"Skipped ({len(skipped)}): "
            + (", ".join(f"Day {m['day']} {m['title']}" for m in skipped) or "None")
            + "\n"
            f"High-attempt topics ({len(hard)}): "
            + (
                ", ".join(
                    f"Day {m['day']} {m['title']} ({m.get('attempts')} attempts)"
                    for m in hard
                )
                or "None"
            )
            + "\nMission detail:\n"
            + "\n".join(mission_lines)
        )

        chunks.append(
            {
                "id": f"candidate-{member.get('id', 'unknown')}",
                "text": text,
                "metadata": {
                    "source": "candidate",
                    "kind": "profile",
                    "candidate_id": member.get("id", ""),
                    "name": member.get("name", ""),
                    "job_role": member.get("jobRole", ""),
                    "day": 0,
                    "title": member.get("name", "Candidate"),
                },
            }
        )

    return chunks


def build_all_chunks(curriculum_path: Path, candidates_path: Path) -> list[dict[str, Any]]:
    return chunk_curriculum(curriculum_path) + chunk_candidates(candidates_path)
