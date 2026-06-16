#!/usr/bin/env python3
"""Aggregate principal-architect validation sessions into a cohort summary."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

_INPUT_SCHEMA = "archlucid.principal-architect-session.v1"
_OUTPUT_SCHEMA = "archlucid.principal-architect-cohort-summary.v1"
_MIN_SESSIONS_FOR_MESSAGING = 3


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _discover_sessions(sessions_dir: Path) -> list[Path]:
    if not sessions_dir.is_dir():
        raise FileNotFoundError(f"Sessions directory not found: {sessions_dir}")

    session_files = sorted(sessions_dir.rglob("session.json"))

    if not session_files:
        raise FileNotFoundError(f"No session.json files found under {sessions_dir}")

    return session_files


def _load_session(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    schema = str(payload.get("schema") or "")

    if schema != _INPUT_SCHEMA:
        raise ValueError(f"Unsupported schema in {path}: {schema or '(missing)'}")

    return payload


def _safe_int(value: object) -> int:
    try:
        return int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0


def _n_share(counts: dict[str, int]) -> float | None:
    total = sum(counts.values())

    if total <= 0:
        return None

    return counts.get("N", 0) / total


def _reuse_score(intent: str) -> int | None:
    normalized = intent.strip().lower()

    if normalized == "yes":
        return 2

    if normalized == "maybe":
        return 1

    if normalized == "no":
        return 0

    return None


def aggregate_sessions(sessions: list[dict[str, Any]]) -> dict[str, Any]:
    session_ids: list[str] = []
    reuse_scores: list[int] = []
    n_shares: list[float] = []
    aggregate_counts: dict[str, int] = {"O": 0, "U": 0, "N": 0, "X": 0, "S": 0}
    per_source: dict[str, dict[str, int]] = {"archlucid": {"O": 0, "U": 0, "N": 0, "X": 0, "S": 0}, "manualFrontierAi": {"O": 0, "U": 0, "N": 0, "X": 0, "S": 0}}

    for session in sessions:
        session_id = str(session.get("sessionId") or "unknown")
        session_ids.append(session_id)

        reuse_intent = str(session.get("reuseIntent") or "")
        reuse_numeric = _reuse_score(reuse_intent)

        if reuse_numeric is not None:
            reuse_scores.append(reuse_numeric)

        source_counts = session.get("sourceCounts") or {}

        for source_key in ("archlucid", "manualFrontierAi"):
            counts = source_counts.get(source_key) if isinstance(source_counts, dict) else {}

            if not isinstance(counts, dict):
                counts = {}

            for code in aggregate_counts:
                value = _safe_int(counts.get(code))
                per_source[source_key][code] += value

    archlucid_share = _n_share(per_source["archlucid"])

    if archlucid_share is not None:
        n_shares.append(archlucid_share)

    manual_share = _n_share(per_source["manualFrontierAi"])

    for code in aggregate_counts:
        aggregate_counts[code] = per_source["archlucid"][code] + per_source["manualFrontierAi"][code]

    session_count = len(sessions)
    messaging_ready = session_count >= _MIN_SESSIONS_FOR_MESSAGING

    return {
        "schema": _OUTPUT_SCHEMA,
        "generatedUtc": _utc_now(),
        "sessionCount": session_count,
        "sessionIds": session_ids,
        "minSessionsForMessaging": _MIN_SESSIONS_FOR_MESSAGING,
        "messagingReady": messaging_ready,
        "archlucid": {
            "counts": per_source["archlucid"],
            "nonObviousShare": round(archlucid_share, 3) if archlucid_share is not None else None,
        },
        "manualFrontierAi": {
            "counts": per_source["manualFrontierAi"],
            "nonObviousShare": round(manual_share, 3) if manual_share is not None else None,
        },
        "cohort": {
            "counts": aggregate_counts,
            "meanArchLucidNonObviousShare": round(mean(n_shares), 3) if n_shares else None,
            "meanReuseScore": round(mean(reuse_scores), 3) if reuse_scores else None,
        },
        "interpretationGuardrails": [
            "This report reduces market uncertainty; it does not prove product superiority on its own.",
            "Do not update public differentiated-value claims until sessionCount >= minSessionsForMessaging and engineering review is complete.",
            "Any critical X finding should be treated as an engineering correctness priority before messaging expansion.",
        ],
    }


def render_markdown(payload: dict[str, Any]) -> str:
    archlucid = payload.get("archlucid", {})
    manual = payload.get("manualFrontierAi", {})
    cohort = payload.get("cohort", {})
    lines = [
        "# Principal-architect validation cohort summary",
        "",
        f"**Generated UTC:** {payload.get('generatedUtc')}",
        f"**Sessions:** {payload.get('sessionCount')}",
        f"**Messaging ready (>= {payload.get('minSessionsForMessaging')} sessions):** {payload.get('messagingReady')}",
        "",
        "## Source comparison",
        "",
        "| Source | Non-obvious share | O | U | N | X | S |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| ArchLucid | {nshare} | {o} | {u} | {n} | {x} | {s} |".format(
            nshare=archlucid.get("nonObviousShare"),
            o=(archlucid.get("counts") or {}).get("O"),
            u=(archlucid.get("counts") or {}).get("U"),
            n=(archlucid.get("counts") or {}).get("N"),
            x=(archlucid.get("counts") or {}).get("X"),
            s=(archlucid.get("counts") or {}).get("S"),
        ),
        "| Manual frontier AI | {nshare} | {o} | {u} | {n} | {x} | {s} |".format(
            nshare=manual.get("nonObviousShare"),
            o=(manual.get("counts") or {}).get("O"),
            u=(manual.get("counts") or {}).get("U"),
            n=(manual.get("counts") or {}).get("N"),
            x=(manual.get("counts") or {}).get("X"),
            s=(manual.get("counts") or {}).get("S"),
        ),
        "",
        "## Cohort summary",
        "",
        f"- Mean ArchLucid non-obvious share: {cohort.get('meanArchLucidNonObviousShare')}",
        f"- Mean reuse score (yes=2, maybe=1, no=0): {cohort.get('meanReuseScore')}",
        "",
        "## Guardrails",
        "",
    ]

    for guardrail in payload.get("interpretationGuardrails", []):
        lines.append(f"- {guardrail}")

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sessions-dir", type=Path, required=True, help="Directory containing principal-architect session files (session.json).")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=False)
    args = parser.parse_args()

    session_paths = _discover_sessions(args.sessions_dir)
    sessions = [_load_session(path) for path in session_paths]
    payload = aggregate_sessions(sessions)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"Wrote principal-architect cohort summary ({payload['sessionCount']} sessions) to {args.json_out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
