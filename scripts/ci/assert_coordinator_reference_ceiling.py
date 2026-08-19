#!/usr/bin/env python3
"""Fail CI when coordinator interface token counts increase (ADR 0021 strangler drift).

Counts substring occurrences in ArchLucid*.cs sources excluding *Tests* paths.
Baseline: scripts/ci/data/coordinator_reference_ceiling.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
BASELINE_PATH = REPO_ROOT / "scripts" / "ci" / "data" / "coordinator_reference_ceiling.json"


def _is_non_test_archlucid_cs(path: Path) -> bool:
    parts = [p.lower() for p in path.parts]
    if ".tests" in str(path).lower():
        return False
    if any("architectur.tests" in p for p in parts):
        return False
    s = str(path).lower()
    return any(
        needle in s
        for needle in (
            "archlucid.application",
            "archlucid.persistence",
            "archlucid.host",
            "archlucid.api",
            "archlucid.decisioning",
            "archlucid.core",
            "archlucid.contracts",
            "archlucid.coordinator",
        )
    )


def count_tokens(tokens: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {t: 0 for t in tokens}
    for path in REPO_ROOT.rglob("*.cs"):
        if not _is_non_test_archlucid_cs(path):
            continue
        text = path.read_text(encoding="utf-8")
        for t in tokens:
            counts[t] += text.count(t)
    return counts


def main() -> int:
    baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    tokens = list(baseline["tokens"].keys())
    actual = count_tokens(tokens)
    ceiling = baseline["tokens"]
    failures: list[str] = []
    for t in tokens:
        if actual[t] > int(ceiling[t]):
            failures.append(f"{t}: actual={actual[t]} ceiling={ceiling[t]}")
    if failures:
        print("Coordinator reference ceiling exceeded:\n- " + "\n- ".join(failures), file=sys.stderr)
        print("Update the baseline only when ADR 0021/0028 owners approve new references.", file=sys.stderr)
        return 1
    print("Coordinator reference ceiling OK:", json.dumps(actual, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
