#!/usr/bin/env python3
"""Check release/proof docs reference known artifact names (T2-19)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

_DOC_TARGETS = [
    "docs/library/V1_RELEASE_CHECKLIST.md",
    "docs/quality/RELEASE_EVIDENCE_BUNDLE_SCHEMA.md",
    "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md",
]
_ARTIFACT_RE = re.compile(r"`([a-z0-9][a-z0-9._-]+\.(?:json|md|ps1))`", re.IGNORECASE)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def known_artifacts(root: Path) -> set[str]:
    profiles_path = root / "scripts" / "ci" / "data" / "release_evidence_bundle_profiles.v1.json"
    profiles = json.loads(profiles_path.read_text(encoding="utf-8"))
    names: set[str] = set()

    for profile in profiles.get("profiles", {}).values():
        for key in ("requiredFiles", "optionalFiles"):
            for name in profile.get(key, []):
                names.add(str(name))

    names.update(
        {
            "buyer-decision-brief.md",
            "first-pilot-command-center.md",
            "go-no-go-summary.json",
            "release-confidence-rollup.json",
        }
    )

    return names


def main() -> int:
    root = repo_root()
    catalog = known_artifacts(root)
    errors: list[str] = []

    for relative in _DOC_TARGETS:
        path = root / relative
        text = path.read_text(encoding="utf-8", errors="replace")

        for match in _ARTIFACT_RE.findall(text):
            if match not in catalog and not match.endswith(".ps1"):
                errors.append(f"{relative}: unknown artifact reference `{match}`")

    if errors:
        for error in sorted(set(errors)):
            print(error)

        return 1

    print("check_release_proof_doc_references: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
