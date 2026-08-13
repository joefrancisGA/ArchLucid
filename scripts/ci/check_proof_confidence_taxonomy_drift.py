#!/usr/bin/env python3
"""Guard canonical proof-confidence labels across UI surfaces (assessment Tier 1 #5)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_TAXONOMY_TS = _REPO_ROOT / "archlucid-ui" / "src" / "lib" / "proof-confidence-taxonomy.ts"

_CANONICAL_LABELS = (
    "Real-mode verified",
    "Mixed evidence",
    "Simulator-only",
    "Evidence not classified",
)

_UI_SURFACES = (
    _TAXONOMY_TS,
    _REPO_ROOT / "archlucid-ui" / "src" / "lib" / "runs" / "run-detail-first-screen-proof-status.ts",
    _REPO_ROOT / "archlucid-ui" / "src" / "lib" / "export-markdown.ts",
)

_FORBIDDEN_DRIFT = (
    re.compile(r"Real mode verified", re.IGNORECASE),
    re.compile(r"Partial real-mode", re.IGNORECASE),
    re.compile(r"Demo-only execution", re.IGNORECASE),
)


def _labels_declared_in_taxonomy(text: str) -> list[str]:
    found: list[str] = []

    for label in _CANONICAL_LABELS:
        if label not in text:
            found.append(f"missing canonical label in taxonomy: {label!r}")

    return found


def _surface_violations(path: Path) -> list[str]:
    if not path.is_file():
        return [f"missing UI surface file: {path.relative_to(_REPO_ROOT)}"]

    text = path.read_text(encoding="utf-8")
    violations: list[str] = []

    for pattern in _FORBIDDEN_DRIFT:
        if pattern.search(text):
            violations.append(
                f"{path.relative_to(_REPO_ROOT)}: forbidden drift phrase {pattern.pattern!r}",
            )

    return violations


def proof_confidence_taxonomy_violations(root: Path) -> list[str]:
    violations: list[str] = []

    if not _TAXONOMY_TS.is_file():
        return ["proof-confidence-taxonomy.ts is missing"]

    taxonomy_text = _TAXONOMY_TS.read_text(encoding="utf-8")
    violations.extend(_labels_declared_in_taxonomy(taxonomy_text))

    for surface in _UI_SURFACES:
        violations.extend(_surface_violations(surface))

    return violations


def main() -> int:
    violations = proof_confidence_taxonomy_violations(_REPO_ROOT)

    if violations:
        print("Proof-confidence taxonomy drift:", file=sys.stderr)

        for line in violations:
            print(f"  - {line}", file=sys.stderr)

        return 1

    print("Proof-confidence taxonomy drift: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
