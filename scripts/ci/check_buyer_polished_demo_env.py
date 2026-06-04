#!/usr/bin/env python3
"""Guard sponsor-facing UI env templates against buyer-polished / operator-shell flag drift (TB-273 / BDA-024).

Merge-blocking: packaged demo builds must not set NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator without also enabling
buyer-polished shell (demo mode or static-operator flags per archlucid-ui/src/lib/demo-ui-env.ts).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ENV_CANDIDATES: tuple[Path, ...] = (
    Path("archlucid-ui/.env.example"),
    Path("archlucid-ui/.env.production.example"),
    Path("docs/engineering/UI_DEPLOY_ENV.md"),
)

OPERATOR_EXPERIENCE_PATTERN = re.compile(
    r"NEXT_PUBLIC_OPERATOR_EXPERIENCE\s*=\s*operator",
    re.IGNORECASE,
)
DEMO_STATIC_PATTERN = re.compile(
    r"NEXT_PUBLIC_DEMO_(?:MODE|STATIC_OPERATOR)\s*=\s*(?:true|1)",
    re.IGNORECASE,
)


def _scan_text(path: Path, text: str) -> list[str]:
    violations: list[str] = []

    if not OPERATOR_EXPERIENCE_PATTERN.search(text):
        return violations

    if DEMO_STATIC_PATTERN.search(text):
        return violations

    violations.append(
        f"{path}: sets NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator without NEXT_PUBLIC_DEMO_MODE or "
        "NEXT_PUBLIC_DEMO_STATIC_OPERATOR — buyer-polished shell will be off while static demo payloads may still load.",
    )

    return violations


def main() -> int:
    violations: list[str] = []

    for relative in ENV_CANDIDATES:
        path = REPO_ROOT / relative

        if not path.is_file():
            continue

        text = path.read_text(encoding="utf-8")
        violations.extend(_scan_text(relative.as_posix(), text))

    if violations:
        print("buyer-polished demo env coherence check FAILED:", file=sys.stderr)

        for line in violations:
            print(f"  - {line}", file=sys.stderr)

        return 1

    print("OK: buyer-polished demo env coherence check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
