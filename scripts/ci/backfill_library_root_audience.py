#!/usr/bin/env python3
"""TB-013 Phase 2: add audience keywords to docs/library/*.md Scope lines (idempotent)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Keep in sync with assert_library_root_audience.py
AUDIENCE_KEYWORDS = (
    "customer-facing",
    "contributor-reference",
    "contributor",
    "buyer",
    "evaluator",
    "operator cookbook",
    "moved",
    "compatibility stub",
)

SCOPE_OPENER_RE = re.compile(r"^\s*>\s*\*\*Scope:\*\*", re.IGNORECASE)
SCOPE_LINE_RE = re.compile(r"^(\s*>\s*\*\*Scope:\*\*\s*)(.*)$", re.IGNORECASE)

BUYER_SUBSTRINGS = (
    "SPONSOR_",
    "PROOF_",
    "PILOT_ROI",
    "CUSTOMER_TRUST",
    "POLICY_PACK_APPENDIX",
    "HOSTED_ENTERPRISE",
    "HOSTED_TRIAL",
    "V1_READINESS",
    "V1_RELEASE_CHECKLIST",
    "SLA_TARGETS",
    "PRODUCT_PACKAGING",
    "COMMERCIAL_",
    "PUBLIC_MARKETING",
    "REFERENCE_SAAS",
    "V1_REQUIREMENTS_TEST",
    "CUSTOMER_SUCCESS",
    "FEATURE_GATE",
)

CUSTOMER_FACING_SUBSTRINGS = (
    "FIRST_RUN",
    "SECOND_RUN",
    "DEMO_",
    "ONBOARDING_WIZARD",
    "CLI_USAGE",
    "OPERATOR_ATLAS",
    "OPERATOR_DECISION",
    "GOLDEN_PATH",
    "GOLDEN_CHANGE",
    "CANONICAL_PIPELINE",
    "CORE_PILOT",
    "demo-quickstart",
)

EVALUATOR_SUBSTRINGS = ("ASSESSMENT_INPUTS",)


UTF8_BOM = "\ufeff"


def strip_bom(text: str) -> str:
    if text.startswith(UTF8_BOM):
        return text[len(UTF8_BOM) :]

    return text


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def has_audience_tag(scope_line: str) -> bool:
    lowered = scope_line.lower()
    return any(keyword in lowered for keyword in AUDIENCE_KEYWORDS)


def classify_audience(stem: str) -> str:
    upper = stem.upper()

    if any(token in upper for token in CUSTOMER_FACING_SUBSTRINGS):
        return "Customer-facing"

    if any(token in upper for token in BUYER_SUBSTRINGS):
        return "Buyer"

    if any(token in upper for token in EVALUATOR_SUBSTRINGS):
        return "Evaluator"

    return "Contributor-reference"


def patch_scope_line(scope_line: str, audience: str) -> str:
    match = SCOPE_LINE_RE.match(scope_line)

    if not match:
        return scope_line

    prefix, body = match.group(1), match.group(2)
    tag = f"{audience} — "

    if body.lower().startswith(tag.lower()):
        return scope_line

    return f"{prefix}{tag}{body}"


def build_scope_line(stem: str, audience: str) -> str:
    label = stem.replace("_", " ").replace("-", " ")
    return f"> **Scope:** {audience} — {label} — technical documentation; see body for narrative and cross-links."


def patch_file(path: Path) -> str | None:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    had_bom = text.startswith(UTF8_BOM)

    if not lines:
        scope_line = build_scope_line(path.stem, classify_audience(path.stem))
        body = scope_line + "\n"
        return UTF8_BOM + body if had_bom else body

    first_non_empty_index = next((index for index, line in enumerate(lines) if line.strip()), None)

    if first_non_empty_index is None:
        scope_line = build_scope_line(path.stem, classify_audience(path.stem))
        body = scope_line + "\n"
        return UTF8_BOM + body if had_bom else body

    scope_line = strip_bom(lines[first_non_empty_index])
    audience = classify_audience(path.stem)

    if SCOPE_OPENER_RE.match(scope_line):
        if has_audience_tag(scope_line):
            return None

        new_scope_line = patch_scope_line(scope_line, audience)

        if new_scope_line == scope_line:
            return None

        lines[first_non_empty_index] = new_scope_line
        patched = "\n".join(lines) + ("\n" if text.endswith("\n") else "")
        return UTF8_BOM + patched if had_bom else patched

    scope_line = build_scope_line(path.stem, audience)
    new_lines = lines[:first_non_empty_index] + [scope_line, ""] + lines[first_non_empty_index:]
    patched = "\n".join(new_lines) + ("\n" if text.endswith("\n") else "")
    return UTF8_BOM + patched if had_bom else patched


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="Print actions only; do not write files.")
    args = parser.parse_args()

    library = repo_root() / "docs" / "library"
    changed = 0

    for path in sorted(library.glob("*.md")):
        updated = patch_file(path)

        if updated is None:
            continue

        rel = path.relative_to(repo_root())

        if args.dry_run:
            print(f"would update: {rel}")
        else:
            path.write_text(updated, encoding="utf-8", newline="\n")
            print(f"updated: {rel}")

        changed += 1

    mode = "dry-run" if args.dry_run else "write"
    print(f"backfill_library_root_audience ({mode}): changed={changed}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
