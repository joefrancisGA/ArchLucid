#!/usr/bin/env python3
"""TB-257 — enforce non-accepted quality gate on adversarial simulator scenarios."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CORPUS_ROOT = REPO_ROOT / "tests" / "eval-corpus"
ADVERSARIAL_ROOT = CORPUS_ROOT / "adversarial"

# Reuse corpus scoring (do not fork gate logic).
sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))
from eval_agent_corpus import (  # noqa: E402
    _load_json,
    evaluate_quality_evidence_block,
)


def _iter_adversarial_scenarios() -> list[Path]:
    paths: list[Path] = []
    for child in sorted(ADVERSARIAL_ROOT.iterdir()):
        if not child.is_dir():
            continue
        scenario = child / "scenario.json"
        if scenario.is_file():
            paths.append(scenario)
    return paths


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--corpus-root",
        type=Path,
        default=CORPUS_ROOT,
        help="Eval corpus root (default: tests/eval-corpus)",
    )
    args = parser.parse_args()
    corpus_root: Path = args.corpus_root.resolve()
    failures: list[str] = []

    for scenario_path in _iter_adversarial_scenarios():
        scenario = _load_json(scenario_path)
        if not isinstance(scenario, dict):
            failures.append(f"{scenario_path}: invalid scenario JSON")
            continue

        scenario_id = str(scenario.get("id") or scenario_path.parent.name)
        qe = scenario.get("qualityEvidence")
        if not isinstance(qe, dict) or str(qe.get("mode") or "") != "simulator":
            continue

        quality = evaluate_quality_evidence_block(corpus_root, scenario_id, qe)
        gate = str(quality.get("gate_outcome") or "")
        if gate == "accepted":
            failures.append(
                f"{scenario_id}: adversarial simulator scored accepted (structural="
                f"{quality.get('structural_score')}, semantic={quality.get('semantic_score')})"
            )

    if failures:
        for line in failures:
            print(f"::error::{line}", file=sys.stderr)
        return 1

    print(f"hallucination resistance OK ({len(_iter_adversarial_scenarios())} adversarial scenarios checked)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
