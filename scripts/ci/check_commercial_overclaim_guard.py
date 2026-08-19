#!/usr/bin/env python3
"""Commercial copy overclaim guard — extends compliance posture scan (TB-134)."""

from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]
_COMPLIANCE = _REPO / "scripts" / "ci" / "check_compliance_posture_clarity.py"

_EXTRA_ROOTS: tuple[str, ...] = (
    "archlucid-ui/src/app/(marketing)",
    "archlucid-ui/src/components/marketing",
)

_EXTRA_PROHIBITED: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bbuy on (the )?marketplace today\b", re.I), "buy on marketplace today"),
    (re.compile(r"\blive stripe\b", re.I), "live stripe"),
    (re.compile(r"\bpublic reference customer\b", re.I), "public reference customer"),
    (re.compile(r"\bproduction-ready ai certification\b", re.I), "production-ready ai certification"),
    (re.compile(r"\bsimulator-only production\b", re.I), "simulator-only production"),
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "not ",
    "no ",
    "deferred",
    "v1.1",
    "do not",
    "does not",
    "self-assessment",
    "roadmap",
    "owner",
    "template",
    "unless",
)


def _load_compliance_module():
    spec = importlib.util.spec_from_file_location("check_compliance_posture_clarity", _COMPLIANCE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def line_has_caveat(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in _CAVEAT_MARKERS)


def scan_extra_roots(root: Path) -> list[str]:
    violations: list[str] = []

    for rel_root in _EXTRA_ROOTS:
        base = root / rel_root

        if not base.is_dir():
            continue

        for path in base.rglob("*"):
            if path.suffix not in {".md", ".tsx", ".ts"}:
                continue

            for index, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
                if line_has_caveat(line):
                    continue

                for pattern, label in _EXTRA_PROHIBITED:
                    if pattern.search(line):
                        violations.append(f"{path.relative_to(root)}:{index}: overclaim {label!r}")

    boundary = root / "docs" / "library" / "PUBLIC_CLAIM_BOUNDARY_GUIDE.md"

    if not boundary.is_file():
        violations.append("missing docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md")

    return violations


def main() -> int:
    compliance = _load_compliance_module()
    root = compliance.repo_root()
    violations = compliance.scan_repo(root)
    violations.extend(scan_extra_roots(root))

    if violations:
        print("Commercial overclaim guard: FAIL", file=sys.stderr)

        for item in violations[:40]:
            print(item, file=sys.stderr)

        if len(violations) > 40:
            print(f"... and {len(violations) - 40} more", file=sys.stderr)

        return 1

    print("Commercial overclaim guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
