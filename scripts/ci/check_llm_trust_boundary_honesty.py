#!/usr/bin/env python3
"""TB-998 / M-148: LLM trust-boundary honesty CI.

Fails dishonest stubs that claim injection-proof customer docs, absolute PDF sanitization,
or model-driven outbound tools/exfil without TB-997 / M-116 residual language.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "llm-trust-boundary-honesty: allow"

CONTRACT_REL = Path("docs/library/LLM_TRUST_BOUNDARY_INGRESS_CONFINEMENT_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/LLM_TRUST_BOUNDARY_INGRESS_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-997**",
    "**TB-998**",
    "M-148",
    "M-149",
    "Structurally impossible",
    "Explicit non-claims",
    "injection-proof",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "≠",
    "does not",
    "doesn't",
    "residual",
    "tb-997",
    "tb-998",
    "m-148",
    "m-149",
    "m-116",
    "forbidden",
    "too strong",
    "hygiene",
    "not injection-proof",
    "may still influence",
    "structurally impossible",
    "no model tool-loop",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(r"\b(?:prompt[-\s]?)?injection[-\s]?proof\b", re.IGNORECASE),
        "Do not claim prompt-injection-proof customer content (TB-997 / M-148).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:we\s+)?sanitize\b[^.\n]{0,80}\b(?:architecture\s+)?pdfs?\b[^.\n]{0,80}\b(?:completely|fully|always)\b",
            re.IGNORECASE,
        ),
        "Do not claim complete PDF sanitization — delimiter hygiene only (TB-997).",
    ),
    ClaimPattern(
        re.compile(
            r"\bmodel\b[^.\n]{0,80}\b(?:can|may)\b[^.\n]{0,80}\b(?:call|invoke|trigger)\b[^.\n]{0,80}\b(?:http|shell|api|webhook)\b",
            re.IGNORECASE,
        ),
        "Do not imply the model can invoke outbound HTTP/shell tools (TB-997).",
    ),
    ClaimPattern(
        re.compile(
            r"\bllm\b[^.\n]{0,80}\b(?:has|with)\b[^.\n]{0,80}\b(?:tools?|function\s+calls?)\b[^.\n]{0,80}\b(?:for|to)\b[^.\n]{0,60}\b(?:http|shell|exfil)\b",
            re.IGNORECASE,
        ),
        "Do not claim model tool-loop for exfil/side effects (TB-997 / TB-952 residual).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcustomer\s+(?:docs?|pdfs?|attachments?)\b[^.\n]{0,80}\b(?:are|is)\b[^.\n]{0,60}\b(?:safe|secure)\b[^.\n]{0,40}\b(?:from|against)\b[^.\n]{0,40}\binjection\b",
            re.IGNORECASE,
        ),
        "Customer docs are untrusted ingress — not injection-safe (TB-997).",
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


def _line_is_forbidden_example(line: str, match: re.Match[str]) -> bool:
    if "|" in line and ("too strong" in line.lower() or "forbid" in line.lower()):
        return True

    prefix = line[: match.start()]
    return sum(prefix.count(ch) for ch in ('"', '"', "\u201c", "\u201d")) % 2 == 1


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL

    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing LLM trust-boundary contract (TB-997)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-998)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing LLM trust-boundary honesty scan target."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = line.lower()

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, match) or _line_has_caveat(line_lower):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`."
            )

    return violations


def llm_trust_boundary_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = llm_trust_boundary_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"LLM trust-boundary honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("LLM trust-boundary honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
