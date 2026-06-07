#!/usr/bin/env python3
"""Acceptance checks for Azure extractor/Terraform emit evidence (T2-16)."""

from __future__ import annotations

import sys
from pathlib import Path

_REQUIRED = [
    "docs/runbooks/AZURE_EXTRACTOR_TERRAFORM_EMIT_ACCEPTANCE.md",
    "docs/library/V1_SCOPE.md",
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    root = repo_root()
    errors: list[str] = []

    for relative in _REQUIRED:
        path = root / relative

        if not path.is_file():
            errors.append(f"Missing: {relative}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        if "Terraform" not in text and "terraform" not in text:
            errors.append(f"No Terraform mention: {relative}")

    bundle_profile = root / "scripts" / "ci" / "data" / "release_evidence_bundle_profiles.v1.json"

    if "terraform-drift-preflight.json" not in bundle_profile.read_text(encoding="utf-8"):
        errors.append("release-readiness profile missing terraform-drift-preflight.json")

    if errors:
        for error in errors:
            print(error)

        return 1

    print("check_azure_extractor_terraform_emit_acceptance: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
