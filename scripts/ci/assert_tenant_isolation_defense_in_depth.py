#!/usr/bin/env python3
"""Guard ADR 0037 tenant isolation decision — no RLS regression in normative docs or pilot copy."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ADR_0037 = REPO_ROOT / "docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md"
DEFENSE_DOC = REPO_ROOT / "docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md"

# Product/marketing C# must not claim SESSION_CONTEXT RLS as the production control.
FORBIDDEN_IN_CS = [
    re.compile(r"SESSION_CONTEXT.*row-level security", re.I),
    re.compile(r"SESSION_CONTEXT-driven row-level security", re.I),
    re.compile(r"RLS is boring on purpose", re.I),
]

CS_SCAN_PATHS = [
    REPO_ROOT / "ArchLucid.Application/Pilots/WhyArchLucidPackBuilder.cs",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main() -> int:
    errors: list[str] = []

    if not ADR_0037.is_file():
        errors.append(f"Missing ADR: {ADR_0037.relative_to(REPO_ROOT)}")

    if not DEFENSE_DOC.is_file():
        errors.append(f"Missing defense-in-depth doc: {DEFENSE_DOC.relative_to(REPO_ROOT)}")

    if ADR_0037.is_file():
        text = _read(ADR_0037)
        if "**Status:** Accepted" not in text:
            errors.append("ADR 0037 must remain Accepted")
        if "does not use SQL Row-Level Security" not in text:
            errors.append("ADR 0037 must state no SQL RLS")

    inv_path = REPO_ROOT / "docs/library/ARCHITECTURE_INVARIANTS.md"
    if inv_path.is_file():
        inv = _read(inv_path)
        if "0037-tenant-isolation-without-rls-defense-in-depth" not in inv:
            errors.append("ARCHITECTURE_INVARIANTS.md must reference ADR 0037 in INV-001")

    for cs_path in CS_SCAN_PATHS:
        if not cs_path.is_file():
            continue
        cs = _read(cs_path)
        for pattern in FORBIDDEN_IN_CS:
            if pattern.search(cs):
                errors.append(
                    f"{cs_path.relative_to(REPO_ROOT)}: stale RLS-as-primary claim ({pattern.pattern})"
                )

    if errors:
        print("Tenant isolation defense-in-depth guard FAILED:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print("Tenant isolation defense-in-depth guard OK (ADR 0037 persisted).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
