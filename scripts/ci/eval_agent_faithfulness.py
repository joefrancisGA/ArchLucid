#!/usr/bin/env python3
"""Offline RAG faithfulness scoring for golden cohort fixtures (Improvement #9 / TB-021).

Mirrors ``RetrievalFaithfulnessEvaluator`` in ``ArchLucid.Retrieval``: a retrieved chunk is
"supported" when its ``sourceId`` or ``title`` appears as a case-insensitive substring in the
agent output text.

Reads ``tests/eval-datasets/faithfulness-golden/cases.json`` and writes
``docs/quality/faithfulness-report.md``. Exit 0 by default; use ``--enforce`` to fail when the
mean support ratio is below ``minSupportRatio``.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _contains_citation(output: str, token: str | None) -> bool:
    if token is None or not str(token).strip():
        return False

    return str(token).lower() in output.lower()


def _evaluate_case(hits: list[dict[str, object]], agent_output: str) -> tuple[int, int, float, list[str]]:
    if not hits:
        return 0, 0, 1.0, []

    supported = 0
    unsupported: list[str] = []

    for hit in hits:
        source_id = str(hit.get("sourceId") or "")
        title = str(hit.get("title") or "")
        cited = _contains_citation(agent_output, source_id) or _contains_citation(agent_output, title)

        if cited:
            supported += 1
            continue

        if source_id.strip():
            unsupported.append(source_id)

    ratio = supported / len(hits)
    return len(hits), supported, ratio, unsupported


def _write_report(
    path: Path,
    *,
    cases: list[dict[str, object]],
    mean_ratio: float,
    min_ratio: float,
) -> None:
    lines = [
        "# RAG faithfulness report",
        "",
        f"- **Cases evaluated:** {len(cases)}",
        f"- **Mean support ratio:** {mean_ratio:.4f}",
        f"- **Floor (minSupportRatio):** {min_ratio:.4f}",
        "",
        "## Per-case results",
        "",
        "| Case | Retrieved | Supported | Ratio |",
        "|------|-----------|-----------|-------|",
    ]

    for row in cases:
        lines.append(
            f"| {row['id']} | {row['retrieved']} | {row['supported']} | {row['ratio']:.4f} |"
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit 1 when mean support ratio is below minSupportRatio.",
    )
    parser.add_argument(
        "--cases",
        type=Path,
        default=None,
        help="Override path to cases.json (default: tests/eval-datasets/faithfulness-golden/cases.json).",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=None,
        help="Override report output path (default: docs/quality/faithfulness-report.md).",
    )
    args = parser.parse_args(argv)

    root = _repo_root()
    cases_path = args.cases or (root / "tests" / "eval-datasets" / "faithfulness-golden" / "cases.json")
    report_path = args.report or (root / "docs" / "quality" / "faithfulness-report.md")

    if not cases_path.is_file():
        print(f"::error::Missing {cases_path}")
        return 1

    payload = _load_json(cases_path)
    if not isinstance(payload, dict):
        print("::error::cases.json must be an object")
        return 1

    min_ratio = float(payload.get("minSupportRatio", 0.8))
    raw_cases = payload.get("cases")
    if not isinstance(raw_cases, list) or not raw_cases:
        print("::error::cases must be a non-empty array")
        return 1

    evaluated: list[dict[str, object]] = []
    ratios: list[float] = []

    for entry in raw_cases:
        if not isinstance(entry, dict):
            print("::error::each case must be an object")
            return 1

        case_id = str(entry.get("id") or "unknown")
        hits = entry.get("retrievalHits")
        output = str(entry.get("agentOutputText") or "")

        if not isinstance(hits, list):
            print(f"::error::case {case_id}: retrievalHits must be an array")
            return 1

        retrieved, supported, ratio, unsupported = _evaluate_case(hits, output)
        ratios.append(ratio)
        evaluated.append(
            {
                "id": case_id,
                "retrieved": retrieved,
                "supported": supported,
                "ratio": ratio,
                "unsupported": unsupported,
            }
        )

        print(
            f"faithfulness case={case_id} retrieved={retrieved} supported={supported} ratio={ratio:.4f}"
        )

    mean_ratio = sum(ratios) / len(ratios)
    _write_report(report_path, cases=evaluated, mean_ratio=mean_ratio, min_ratio=min_ratio)

    print(f"Wrote {report_path}")
    print(f"Mean faithfulness support ratio: {mean_ratio:.4f} (floor {min_ratio:.4f})")

    if args.enforce and mean_ratio < min_ratio:
        print(
            f"::error::Mean support ratio {mean_ratio:.4f} is below floor {min_ratio:.4f}",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
