#!/usr/bin/env python3
"""TB-013 Phase 2: docs/library root markdown must declare audience in Scope or be a move stub."""

from __future__ import annotations

import re
import sys
from pathlib import Path

AUDIENCE_KEYWORDS = (
    "customer-facing",
    "contributor-reference",
    "contributor",
    "buyer",
    "evaluator",
    "operator cookbook",
    "moved",
    "compatibility stub",
)

SCOPE_RE = re.compile(r"^\s*>\s*\*\*Scope:\*\*", re.IGNORECASE)


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    library = root / "docs" / "library"
    violations: list[str] = []

    for path in sorted(library.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        scope_line = next((line for line in lines if line.strip()), "")

        if not SCOPE_RE.match(scope_line):
            violations.append(f"{path.relative_to(root)}: missing Scope blockquote")
            continue

        lowered = scope_line.lower()

        if not any(keyword in lowered for keyword in AUDIENCE_KEYWORDS):
            violations.append(
                f"{path.relative_to(root)}: Scope line lacks audience tagging ({', '.join(AUDIENCE_KEYWORDS[:4])}…)"
            )

    if violations:
        print("::error::docs/library root markdown audience gate failed:")
        for item in violations:
            print(f"  - {item}")
        return 1

    print(f"[audience-gate] OK — {len(list(library.glob('*.md')))} root library markdown file(s) tagged.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
