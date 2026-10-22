#!/usr/bin/env python3
"""TB-1318 / M-233: Anti-TF-state-is-SoT / silent-ignore / portal-undetected honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "container-apps-terraform-authority-honesty: allow"

CONTRACT_REL = Path("docs/library/CONTAINER_APPS_TERRAFORM_AUTHORITY_AND_DRIFT_CONTRACT.md")
MAIN_TF_REL = Path("infra/terraform-container-apps/main.tf")
IMAGE_OWNERSHIP_REL = Path("infra/terraform-container-apps/container_app_image_ownership.tf")
DRIFT_PREFLIGHT_REL = Path("scripts/Assert-TerraformDeploymentDriftPreflight.ps1")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1317**",
    "**TB-1318**",
    "M-233",
    "Explicit non-claims",
    "CI anchors for **TB-1318**",
    "lifecycle.ignore_changes",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "tb-1317",
    "tb-1318",
    "m-233",
    "honesty guard",
    "non-claim",
    "≠",
    "not alone",
    "without naming",
    "cd owns",
    "ignore_changes",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bterraform\s+state\b[^.\n]{0,80}\b(?:is|as)\b[^.\n]{0,40}\b"
            r"(?:the\s+)?(?:only\s+)?source\s+of\s+truth\b",
            re.IGNORECASE,
        ),
        "TF state alone is not SoT for Container Apps — name ownership splits (TB-1317).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:drift\s+preflight|stack\s+doctor|assert-terraformdeploymentdriftpreflight)\b"
            r"[^.\n]{0,80}\b(?:proves?|guarantees?|alone\s+ensures?)\b[^.\n]{0,60}\b"
            r"(?:no|zero)\b[^.\n]{0,40}\b(?:azure\s+)?drift\b",
            re.IGNORECASE,
        ),
        "Static preflight does not prove live Azure matches TF-owned attrs (TB-1317).",
    ),
    ClaimPattern(
        re.compile(
            r"\bscale\s+rules?\b[^.\n]{0,80}\b(?:cannot|can\s+not|won't)\b[^.\n]{0,40}\bdrift\b"
            r"[^.\n]{0,40}\bbecause\b[^.\n]{0,40}\bterraform\b",
            re.IGNORECASE,
        ),
        "Scale rules can drift via portal/CLI — TF declares intent, not full proof (TB-1317).",
    ),
    ClaimPattern(
        re.compile(
            r"\bkey\s+vault\b[^.\n]{0,80}\bsecret\b[^.\n]{0,60}\b(?:values?|contents?)\b"
            r"[^.\n]{0,40}\b(?:are\s+)?(?:in|from)\b[^.\n]{0,40}\bterraform\s+state\b",
            re.IGNORECASE,
        ),
        "KV secret values are not authoritative in TF state — references only (TB-1317).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcontainer\s+apps?\b[^.\n]{0,80}\b(?:fully|completely)\b[^.\n]{0,40}\b"
            r"(?:iac|terraform)[- ]authoritative\b",
            re.IGNORECASE,
        ),
        "Container Apps have intentional ignore_changes / CD-owned surfaces (TB-657).",
    ),
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())
    return text[line_start:] if line_end == -1 else text[line_start:line_end]


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _is_markdown_table_data_row(line: str) -> bool:
    stripped = line.lstrip()
    if not stripped.startswith("|"):
        return False
    if re.match(r"^\|[\s|:-]+$", stripped):
        return False
    return stripped.count("|") >= 3


def _match_is_quoted_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    for open_quote, close_quote in (('"', '"'), ("\u201c", "\u201d"), ("\u2018", "\u2019")):
        cursor = 0
        while cursor < len(line):
            open_index = line.find(open_quote, cursor)
            if open_index < 0:
                break
            close_index = line.find(close_quote, open_index + len(open_quote))
            if close_index < 0:
                break
            quoted_end = close_index + len(close_quote)
            if open_index <= match_start and match_end <= quoted_end:
                return True
            cursor = quoted_end
    return False


def _line_is_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    if _match_is_quoted_forbidden_example(line, match_start, match_end):
        return True
    stripped = line.lstrip().lower()
    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no \u201c" in stripped):
        return True
    if _is_markdown_table_data_row(line):
        return True
    if stripped.startswith("|") and (
        "unsafe" in stripped or "forbid" in stripped or "too strong" in stripped or "ci anchors" in stripped
    ):
        return True
    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing Container Apps authority contract (TB-1317)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1318)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (MAIN_TF_REL, ("lifecycle", "ignore_changes")),
        (IMAGE_OWNERSHIP_REL, ("TB-657", "lifecycle.ignore_changes")),
        (DRIFT_PREFLIGHT_REL, ("TerraformDeploymentDriftPreflight",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing Container Apps authority code anchor (TB-1318).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1318).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing Container Apps authority honesty scan target."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = line.lower()
            line_start = text.rfind("\n", 0, match.start()) + 1
            match_start_in_line = match.start() - line_start
            match_end_in_line = match.end() - line_start
            if (
                _line_is_allowlisted(line)
                or _line_is_forbidden_example(line, match_start_in_line, match_end_in_line)
                or _line_has_caveat(line_lower)
            ):
                continue
            violations.append(f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`.")
    return violations


def container_apps_terraform_authority_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(code_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = container_apps_terraform_authority_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Container Apps Terraform authority honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Container Apps Terraform authority honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
