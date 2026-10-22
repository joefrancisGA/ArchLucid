#!/usr/bin/env python3
"""Write a static JSON snapshot for operator Home AI quality / retrieval IR trend strip."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
REPORT_PATH = REPO_ROOT / "docs" / "quality" / "retrieval-ir-report.md"
OUT_PATH = REPO_ROOT / "archlucid-ui" / "public" / "operator-ai-quality-snapshot.json"
HISTORY_PATH = REPO_ROOT / "archlucid-ui" / "public" / "operator-ai-quality-history.json"
HISTORY_MAX_ENTRIES = 12
EVAL_DOC = "docs/library/AGENT_OUTPUT_EVALUATION.md"
IR_DOC = "docs/quality/retrieval-ir-report.md"


def _parse_report_metrics(text: str) -> dict[str, float | int | None]:
    cases = None
    recall = None
    mrr = None
    floor_recall = None
    floor_mrr = None

    for line in text.splitlines():
        if "**Cases evaluated:**" in line:
            match = re.search(r"(\d+)", line)
            if match:
                cases = int(match.group(1))
        if "**Mean recall@5:**" in line:
            match = re.search(r"([\d.]+)", line)
            if match:
                recall = float(match.group(1))
        if "**Mean MRR:**" in line:
            match = re.search(r"([\d.]+)", line)
            if match:
                mrr = float(match.group(1))
        if "**Floor recall@5:**" in line:
            match = re.search(r"([\d.]+)", line)
            if match:
                floor_recall = float(match.group(1))
        if "**Floor MRR:**" in line:
            match = re.search(r"([\d.]+)", line)
            if match:
                floor_mrr = float(match.group(1))

    return {
        "casesEvaluated": cases,
        "meanRecallAt5": recall,
        "meanMrr": mrr,
        "floorRecallAt5": floor_recall,
        "floorMrr": floor_mrr,
    }


def _resolve_disposition(metrics: dict[str, float | int | None]) -> str:
    if not REPORT_PATH.is_file():
        return "NOT_GENERATED"

    recall = metrics.get("meanRecallAt5")
    mrr = metrics.get("meanMrr")
    floor_recall = metrics.get("floorRecallAt5")
    floor_mrr = metrics.get("floorMrr")

    if (
        recall is not None
        and mrr is not None
        and floor_recall is not None
        and floor_mrr is not None
        and recall >= floor_recall
        and mrr >= floor_mrr
    ):
        return "PASS"

    if recall is not None and mrr is not None:
        return "WARN"

    return "WARN"


def _append_history(
    *,
    generated_utc: str,
    disposition: str,
    metrics: dict[str, float | int | None],
) -> list[dict[str, object]]:
    entry = {
        "generatedUtc": generated_utc,
        "disposition": disposition,
        "retrievalIr": metrics,
    }

    history: list[dict[str, object]] = []

    if HISTORY_PATH.is_file():
        try:
            loaded = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
            if isinstance(loaded, list):
                history = [row for row in loaded if isinstance(row, dict)]
        except json.JSONDecodeError:
            history = []

    if history and history[-1].get("generatedUtc") == generated_utc:
        history[-1] = entry
    else:
        history.append(entry)

    return history[-HISTORY_MAX_ENTRIES:]


def main() -> int:
    metrics: dict[str, float | int | None] = {
        "casesEvaluated": None,
        "meanRecallAt5": None,
        "meanMrr": None,
        "floorRecallAt5": None,
        "floorMrr": None,
    }

    if REPORT_PATH.is_file():
        parsed = _parse_report_metrics(REPORT_PATH.read_text(encoding="utf-8"))
        metrics.update(parsed)

    generated_utc = datetime.now(timezone.utc).isoformat()
    disposition = _resolve_disposition(metrics)
    history = _append_history(
        generated_utc=generated_utc,
        disposition=disposition,
        metrics=metrics,
    )

    payload = {
        "generatedUtc": generated_utc,
        "disposition": disposition,
        "retrievalIr": metrics,
        "history": history,
        "remediationLinks": [
            {"label": "Regenerate retrieval IR", "path": "scripts/ci/eval_retrieval_ir.py"},
            {"label": "AI readiness gate docs", "path": EVAL_DOC},
            {"label": "Retrieval IR report", "path": IR_DOC},
            {"label": "In-app health", "path": "/health"},
        ],
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    HISTORY_PATH.write_text(json.dumps(history, indent=2) + "\n", encoding="utf-8")
    print(f"operator ai quality snapshot: {disposition} -> {OUT_PATH.relative_to(REPO_ROOT)}")
    print(f"operator ai quality history: {len(history)} entries -> {HISTORY_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
