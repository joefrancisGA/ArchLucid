#!/usr/bin/env python3
"""
Ensure V1 GA integration surfaces appear in CONNECTOR_READINESS_MATRIX and CONNECTOR_SMOKE_INDEX.

Run from repo root: python scripts/ci/assert_connector_smoke_index_v1_surfaces.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


REQUIRED_V1_GA_MARKERS: tuple[tuple[str, str], ...] = (
    ("REST API (OpenAPI)", "CONNECTOR_READINESS_MATRIX.md"),
    ("`archlucid` CLI", "CONNECTOR_READINESS_MATRIX.md"),
    ("SCIM 2.0 provisioning", "CONNECTOR_READINESS_MATRIX.md"),
    ("GitHub", "CONNECTOR_READINESS_MATRIX.md"),
    ("Azure DevOps", "CONNECTOR_READINESS_MATRIX.md"),
    ("Azure extractor", "CONNECTOR_READINESS_MATRIX.md"),
    ("Procurement pack", "CONNECTOR_READINESS_MATRIX.md"),
    ("V1 GA buyer-contract surfaces", "CONNECTOR_SMOKE_INDEX.md"),
    ("REST / OpenAPI", "CONNECTOR_SMOKE_INDEX.md"),
    ("CLI", "CONNECTOR_SMOKE_INDEX.md"),
    ("SCIM", "CONNECTOR_SMOKE_INDEX.md"),
    ("GitHub", "CONNECTOR_SMOKE_INDEX.md"),
    ("Azure DevOps", "CONNECTOR_SMOKE_INDEX.md"),
    ("Procurement pack ZIP", "CONNECTOR_SMOKE_INDEX.md"),
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    args = parser.parse_args(argv)
    root: Path = args.repo_root.resolve()

    matrix = (root / "docs/library/CONNECTOR_READINESS_MATRIX.md").read_text(encoding="utf-8")
    smoke = (root / "docs/integrations/CONNECTOR_SMOKE_INDEX.md").read_text(encoding="utf-8")
    errors: list[str] = []

    for marker, doc in REQUIRED_V1_GA_MARKERS:
        text = matrix if doc.endswith("CONNECTOR_READINESS_MATRIX.md") else smoke

        if marker not in text:
            errors.append(f"{doc}: missing marker `{marker}`")

    if "Not V1-required" not in smoke and "V1.1" not in smoke:
        errors.append("CONNECTOR_SMOKE_INDEX.md: missing V1.1 / not-required boundary language")

    if errors:
        print("assert_connector_smoke_index_v1_surfaces: FAILED", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print("assert_connector_smoke_index_v1_surfaces: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
