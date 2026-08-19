#!/usr/bin/env python3
"""Verify Azure AI Search production-like evidence hooks (T2-13)."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    root = repo_root()
    errors: list[str] = []
    scope = root / "docs" / "library" / "V1_SCOPE.md"
    lint = root / "scripts" / "ci" / "data" / "release_evidence_bundle_profiles.v1.json"

    if not scope.is_file() or "Azure AI Search" not in scope.read_text(encoding="utf-8", errors="replace"):
        errors.append("V1_SCOPE.md must mention Azure AI Search for production-like profiles")

    profiles = json.loads(lint.read_text(encoding="utf-8"))
    optional = profiles["profiles"]["release-readiness"].get("optionalFiles", [])

    if "config-lint-production-like-hosted-pilot.json" not in profiles["profiles"]["release-readiness"]["requiredFiles"]:
        errors.append("release-readiness profile must require config-lint-production-like-hosted-pilot.json")

    if "azure-ai-search-readiness.json" not in optional:
        errors.append("release-readiness optionalFiles should include azure-ai-search-readiness.json")

    if errors:
        for error in errors:
            print(error)

        return 1

    print("check_azure_ai_search_release_evidence: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
