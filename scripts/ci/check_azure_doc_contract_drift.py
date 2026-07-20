#!/usr/bin/env python3
"""Check Azure doc-contract invariants across scope, trust, procurement, and runbooks."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_INVARIANTS: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "docs/library/V1_SCOPE.md",
        (
            "advisory",
            "Terraform",
            "private endpoint",
        ),
    ),
    (
        "docs/go-to-market/trust-center.md",
        (
            "database-per-tenant",
            "ADR",
        ),
    ),
    (
        "docs/runbooks/AZURE_EXTRACTOR_TERRAFORM_EMIT_ACCEPTANCE.md",
        (
            "extractor",
            "Terraform",
        ),
    ),
    (
        "docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md",
        (
            "database-per-tenant",
        ),
    ),
)

_FORBIDDEN_RLS_PRIMARY = (
    "docs/security/SOC2_SELF_ASSESSMENT_2026.md",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def check_invariants(root: Path) -> list[str]:
    violations: list[str] = []

    for relative, phrases in _INVARIANTS:
        path = root / relative

        if not path.is_file():
            violations.append(f"Missing doc: {relative}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace").lower()

        for phrase in phrases:
            if phrase.lower() not in text:
                violations.append(f"{relative}: missing invariant phrase {phrase!r}")

    for relative in _FORBIDDEN_RLS_PRIMARY:
        path = root / relative

        if not path.is_file():
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        if "SQL RLS + `SESSION_CONTEXT`" in text and "database-per-tenant" not in text:
            violations.append(
                f"{relative}: primary isolation still references SQL RLS without ADR 0037 database-per-tenant framing",
            )

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    args = parser.parse_args(argv)

    violations = check_invariants(args.repo_root.resolve())

    if violations:
        print("Azure doc-contract drift: FAIL", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Azure doc-contract drift: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
