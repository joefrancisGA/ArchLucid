#!/usr/bin/env python3
"""V1 guard: do not claim independent verification without qualifying evidence."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ALLOWLIST_MARKER = "independent-verification-honesty: allow"

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
)

CLAIM_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(
            r"\b(?:independently\s+verified|independent\s+verification|"
            r"independently\s+validated|third[-\s]party\s+verified)\b",
            re.IGNORECASE,
        ),
        "Independent/third-party verification requires a qualifying verifier record or real pilot evidence.",
    ),
)

_CAVEAT_MARKERS = (
    "do not",
    "don't",
    "must not",
    "not",
    "without",
    "only when",
    "requires",
    "require",
    "model self-check",
    "not yet",
    "future",
    "roadmap",
    "hypothetical",
    "example",
    "question",
)


def _line_for_match(text: str, match: re.Match[str]) -> str:
    start = text.rfind("\n", 0, match.start()) + 1
    end = text.find("\n", match.start())
    return text[start:] if end == -1 else text[start:end]


def _quoted_or_example(line: str) -> bool:
    stripped = line.lstrip().lower()
    if stripped.startswith(("-", "*", ">")):
        return True
    return any(marker in stripped for marker in ("for example", "e.g.", "sample:", "example:"))


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing independent-verification honesty scan target."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for pattern, message in CLAIM_PATTERNS:
        for match in pattern.finditer(text):
            line = _line_for_match(text, match)
            lowered = line.lower()
            if ALLOWLIST_MARKER in lowered or _quoted_or_example(line):
                continue
            if any(marker in lowered for marker in _CAVEAT_MARKERS):
                continue
            violations.append(
                f"{rel.as_posix()}: {message} Matched `{match.group(0)}`."
            )
    return violations


def independent_verification_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = independent_verification_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Independent verification honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1

    print("Independent verification honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
