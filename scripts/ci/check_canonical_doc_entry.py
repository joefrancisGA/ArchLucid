#!/usr/bin/env python3
"""Guard buyer/operator canonical doc entry points and freshness metadata."""

from __future__ import annotations

import re
import sys
from datetime import date, datetime
from pathlib import Path

LAST_REVIEWED_RE = re.compile(
    r"^\s*\*\*Last reviewed:\*\*\s*(\d{4}-\d{2}-\d{2})\s*$",
    re.IGNORECASE | re.MULTILINE,
)
CANONICAL_CHECKLIST_CLAIM_RE = re.compile(
    r"canonical (?:first[- ]pilot )?(?:operational )?checklist",
    re.IGNORECASE,
)
STALE_DAYS = 400


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _head(path: Path, lines: int = 60) -> str:
    return "\n".join(path.read_text(encoding="utf-8", errors="replace").splitlines()[:lines])


def main() -> int:
    root = repo_root()
    errors: list[str] = []
    warnings: list[str] = []

    start_here = root / "docs" / "START_HERE.md"
    operator_path = root / "docs" / "runbooks" / "FIRST_PILOT_OPERATOR_PATH.md"

    role_index = root / "docs" / "runbooks" / "ROLE_INDEX.md"
    runbooks_readme = root / "docs" / "runbooks" / "README.md"

    if not start_here.is_file():
        errors.append("Missing docs/START_HERE.md")
    else:
        start_head = _head(start_here)

        if "FIRST_PILOT_OPERATOR_PATH.md" not in start_head:
            errors.append("START_HERE.md must link FIRST_PILOT_OPERATOR_PATH.md as operator checklist entry")

        if "ROLE_INDEX.md" not in start_head:
            errors.append("START_HERE.md must link ROLE_INDEX.md as persona entry map")

    if not role_index.is_file():
        errors.append("Missing docs/runbooks/ROLE_INDEX.md")
    else:
        role_text = role_index.read_text(encoding="utf-8", errors="replace")

        for persona in ("Operator", "Platform engineer", "Release owner"):
            if persona not in role_text:
                errors.append(f"ROLE_INDEX.md must include persona section: {persona}")

        if "If this failed, go here" not in role_text:
            errors.append("ROLE_INDEX.md must include failure-branch sections")

    if runbooks_readme.is_file() and "ROLE_INDEX.md" not in _head(runbooks_readme, 25):
        errors.append("docs/runbooks/README.md must link ROLE_INDEX.md near the top")

    differentiation = root / "docs" / "go-to-market" / "DIFFERENTIATION_PROOF_PACKET.md"

    if not differentiation.is_file():
        errors.append("Missing docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md")

    azdo_handoff = root / "docs" / "runbooks" / "V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md"

    if not azdo_handoff.is_file():
        errors.append("Missing docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md")

    canonical_docs = [
        root / "docs" / "START_HERE.md",
        root / "docs" / "CORE_PILOT.md",
        operator_path,
        root / "docs" / "go-to-market" / "trust-center.md",
        root / "docs" / "library" / "V1_SCOPE.md",
    ]

    today = date.today()

    for path in canonical_docs:
        if not path.is_file():
            errors.append(f"Missing required canonical doc: {path.relative_to(root)}")
            continue

        head = _head(path, 50)
        match = LAST_REVIEWED_RE.search(head)

        if path.name in {"START_HERE.md", "CORE_PILOT.md"}:
            continue

        if not match:
            warnings.append(f"{path.relative_to(root)}: missing **Last reviewed:** in first 50 lines")
            continue

        reviewed = datetime.strptime(match.group(1), "%Y-%m-%d").date()
        age = (today - reviewed).days

        if age > STALE_DAYS:
            warnings.append(f"{path.relative_to(root)}: Last reviewed {match.group(1)} ({age} days old)")

    duplicate_claim_paths: list[str] = []

    for md in (root / "docs").rglob("*.md"):
        rel = md.relative_to(root).as_posix()

        if rel.startswith("docs/archive/"):
            continue

        if rel == "docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md":
            continue

        text = md.read_text(encoding="utf-8", errors="replace")

        if CANONICAL_CHECKLIST_CLAIM_RE.search(text) and "not a second checklist" not in text.lower():
            if "canonical operational checklist" in text.lower() and "this file" in text.lower():
                continue

            if CANONICAL_CHECKLIST_CLAIM_RE.search(text):
                if "FIRST_PILOT_OPERATOR_PATH" in text and "depth" in text.lower():
                    continue

                duplicate_claim_paths.append(rel)

    for rel in sorted(set(duplicate_claim_paths)):
        if rel in {
            "docs/START_HERE.md",
            "docs/onboarding/EVALUATOR_WORKBOOK.md",
            "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md",
        }:
            continue

        if "claims to be the canonical first-pilot checklist" in rel:
            continue

        warnings.append(f"{rel}: may claim canonical checklist — demote or point to FIRST_PILOT_OPERATOR_PATH.md")

    if errors:
        print("ERRORS:")
        print("  " + "\n  ".join(errors))

    if warnings:
        print("WARNINGS:")
        print("  " + "\n  ".join(warnings))

    if not errors and not warnings:
        print("check_canonical_doc_entry: OK")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
