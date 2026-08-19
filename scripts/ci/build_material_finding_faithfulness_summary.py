#!/usr/bin/env python3
"""Offline material-finding citation/faithfulness rollup for RC evidence."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.material-finding-faithfulness-summary.v1"

_MATERIAL_SCENARIOS: tuple[str, ...] = (
    "scenario-three-tier-web.json",
    "adversarial/phantom-dependency/scenario.json",
    "adversarial/unsupported-roi-claim/scenario.json",
)


def _load_eval_module(ci_dir: Path):
    path = ci_dir / "eval_agent_corpus.py"
    spec = importlib.util.spec_from_file_location("eval_agent_corpus", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def build_summary(corpus_root: Path, ci_dir: Path) -> dict[str, Any]:
    eval_mod = _load_eval_module(ci_dir)
    rows: list[dict[str, Any]] = []
    citation_required = 0
    citation_pass = 0

    for rel in _MATERIAL_SCENARIOS:
        scen_path = corpus_root / rel

        if not scen_path.is_file():
            rows.append(
                {
                    "scenarioId": rel,
                    "verdict": "MISSING",
                    "recall": 0.0,
                    "detail": "scenario file not found",
                }
            )
            continue

        try:
            row = eval_mod.evaluate_scenario(scen_path, corpus_root)
        except (FileNotFoundError, OSError, ValueError, json.JSONDecodeError) as exc:
            rows.append(
                {
                    "scenarioId": rel,
                    "verdict": "MISSING",
                    "recall": 0.0,
                    "detail": str(exc),
                }
            )
            continue

        scenario = json.loads(scen_path.read_text(encoding="utf-8"))
        expected = scenario.get("expectedFindings") or []
        requires_refs = any(rule.get("evidenceRefsMustContain") for rule in expected if isinstance(rule, dict))

        if requires_refs:
            citation_required += 1

            if float(row.get("recall") or 0.0) >= 1.0:
                citation_pass += 1

        recall = float(row.get("recall") or 0.0)
        verdict = "PASS" if recall >= 1.0 else ("WARN" if recall >= 0.6 else "HOLD")

        rows.append(
            {
                "scenarioId": str(row.get("id") or rel),
                "verdict": verdict,
                "recall": recall,
                "evidenceMode": "offline-fixture",
                "requiresEvidenceRefs": requires_refs,
                "detail": f"recall={recall:.2f}",
            }
        )

    rollup = "PASS"

    if any(row["verdict"] == "HOLD" for row in rows):
        rollup = "HOLD"
    elif any(row["verdict"] in {"WARN", "MISSING"} for row in rows):
        rollup = "WARN"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "rollup": rollup,
        "evidenceMode": "offline-fixture",
        "citationCoverage": {
            "scenariosRequiringEvidenceRefs": citation_required,
            "scenariosPassingCitationRules": citation_pass,
        },
        "claimBoundary": (
            "Offline corpus scenarios with evidenceMustContain/evidenceRefsMustContain rules. "
            "Does not prove live-model material-finding faithfulness."
        ),
        "scenarios": rows,
    }


def write_markdown(summary: dict[str, Any], path: Path) -> None:
    citation = summary["citationCoverage"]
    lines = [
        "# Material finding faithfulness summary",
        "",
        f"Generated UTC: **{summary['generatedUtc']}**",
        f"Rollup: **{summary['rollup']}**",
        "",
        f"Citation scenarios passing: **{citation['scenariosPassingCitationRules']}** / "
        f"**{citation['scenariosRequiringEvidenceRefs']}** requiring evidence refs",
        "",
        "| Scenario | Verdict | Recall | Requires evidence refs | Detail |",
        "| --- | --- | --- | --- | --- |",
    ]

    for row in summary["scenarios"]:
        lines.append(
            f"| {row['scenarioId']} | **{row['verdict']}** | {row['recall']:.2f} | "
            f"{'yes' if row.get('requiresEvidenceRefs') else 'no'} | {row['detail']} |"
        )

    lines.extend(["", summary["claimBoundary"], ""])
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--corpus",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "tests" / "eval-corpus",
    )
    parser.add_argument("--json-out", required=True)
    parser.add_argument("--markdown-out", required=True)
    parser.add_argument("--enforce", action="store_true", help="Exit 1 when rollup is HOLD")
    args = parser.parse_args()

    ci_dir = Path(__file__).resolve().parent
    corpus_root = args.corpus.resolve()
    summary = build_summary(corpus_root, ci_dir)

    json_path = Path(args.json_out).expanduser().resolve()
    md_path = Path(args.markdown_out).expanduser().resolve()
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    write_markdown(summary, md_path)

    if args.enforce and summary["rollup"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
