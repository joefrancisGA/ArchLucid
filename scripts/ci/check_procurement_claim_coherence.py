#!/usr/bin/env python3
"""Check high-risk procurement claim coherence across buyer-facing documents."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SCRIPTS_DIR = _REPO_ROOT / "scripts"

if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

import procurement_pack_validation as pp_val  # noqa: E402


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    docs = (
        Path("docs") / "go-to-market" / "TRUST_CENTER.md",
        Path("docs") / "go-to-market" / "CURRENT_ASSURANCE_POSTURE.md",
        Path("docs") / "go-to-market" / "PROCUREMENT_FAQ.md",
        Path("docs") / "go-to-market" / "SOC2_STATUS_PROCUREMENT.md",
    )

    errors: list[str] = []

    for rel in docs:
        d = _REPO_ROOT / rel

        if not d.is_file():

            print(f"ERROR missing required doc: {rel.as_posix()}", file=sys.stderr)
            return 1

        text = read(d)
        issue = pp_val.coherence_procurement_claims(text)

        if issue is not None:
            errors.append(f"{rel.as_posix()}: {issue}")

    if errors:
        print("Procurement claim coherence FAILED:", file=sys.stderr)

        for error in errors:
            print(f"  - {error}", file=sys.stderr)

        return 1

    print("Procurement claim coherence OK")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
