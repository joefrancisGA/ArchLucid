#!/usr/bin/env python3
"""Acceptance checks for Azure extractor/Terraform emit evidence (T2-16)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_REQUIRED = [
    "docs/runbooks/AZURE_EXTRACTOR_TERRAFORM_EMIT_ACCEPTANCE.md",
    "docs/library/V1_SCOPE.md",
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def evaluate_acceptance(root: Path) -> tuple[str, list[str]]:
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

    disposition = "PASS" if not errors else "HOLD"
    return disposition, errors


def write_status_json(path: Path, disposition: str, errors: list[str]) -> None:
    payload = {
        "schema": "archlucid.azure-extractor-terraform-emit-status.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "status": disposition,
        "disposition": disposition,
        "detail": "; ".join(errors) if errors else "Azure extractor + Terraform emit acceptance OK",
        "exitCode": 0 if disposition == "PASS" else 1,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument("--strict-rc", action="store_true")
    args = parser.parse_args(argv)

    root = repo_root()
    disposition, errors = evaluate_acceptance(root)

    if args.json_out is not None:
        write_status_json(args.json_out, disposition, errors)

    if errors:
        for error in errors:
            print(error)

        if args.strict_rc or args.json_out is None:
            return 1

        return 1

    print("check_azure_extractor_terraform_emit_acceptance: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
