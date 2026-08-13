#!/usr/bin/env python3
"""TB-1197 / M-203: Anti-unvalidated-proposal-overlay honesty CI.

Fails dishonest stubs that:
- Sell agent free text / unvalidated ProposedChanges as the signed architecture package.
- Claim PilotStrict green alone makes Real overlays corruption-proof.
- Omit validate-before-overlay / typed-findings decide language on agent-merge claims.

Contract: docs/library/AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md (TB-1196 / TB-1197).
Complements TB-1007 (Authority vs AgentTask) without duplicating PilotStrict floor rules (Done TB-684).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "unvalidated-proposal-overlay-honesty: allow"

CONTRACT_REL = Path(
    "docs/library/AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md"
)

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path(
        "docs/go-to-market/AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_PA_ONE_PAGER.md"
    ),
    Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    CONTRACT_REL,
)

PRIMARY_CLAIM_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1196**",
    "**TB-1197**",
    "check_unvalidated_proposal_overlay_honesty.py",
    "Validate-before-overlay",
    "AgentTopologyProposalGraphMerge",
    "M-203",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "agent-output-decisioning-real-variance-m-204",
    "TB-1197",
    "AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    (
        "agent free text = signed package",
        "Agent free text is not the signed package (M-203 / TB-1197).",
    ),
    (
        "agent free text is the signed package",
        "Agent free text is not the signed package (M-203 / TB-1197).",
    ),
    (
        "unvalidated proposedchanges = signed package",
        "Unvalidated ProposedChanges are advisory until validate-before-overlay (M-203 / TB-1197).",
    ),
    (
        "unvalidated proposed changes = signed package",
        "Unvalidated ProposedChanges are advisory until validate-before-overlay (M-203 / TB-1197).",
    ),
    (
        "llm text = signed package",
        "LLM prose is not the signed architecture package (M-203 / TB-1197).",
    ),
    (
        "agent prose is the signed package",
        "Agent prose is not the signed architecture package (M-203 / TB-1197).",
    ),
    (
        "pilotstrict green = real overlays corruption-proof",
        "PilotStrict green does not make Real overlays corruption-proof (M-203 / TB-1197).",
    ),
    (
        "pilotstrict green makes real overlays corruption-proof",
        "PilotStrict green does not make Real overlays corruption-proof (M-203 / TB-1197).",
    ),
    (
        "pilotstrict green closed agenttask overlay risk",
        "Treat PilotStrict green closing AgentTask overlay risk as a review finding (M-203 / TB-1197).",
    ),
    (
        "prose into governance",
        "Prose must not become governance truth without typed gates (M-203 / TB-1197).",
    ),
)

PRIMARY_CLAIM_MARKERS: tuple[str, ...] = (
    "agent free text",
    "unvalidated proposedchanges",
    "unvalidated proposed changes",
    "validate-before-overlay",
    "agenttopologyproposalgraphmerge",
    "agent topology proposal",
    "pilotstrict green",
)

TB_1196_ANCHOR_MARKERS: tuple[str, ...] = (
    "tb-1196",
    "tb-1197",
    "m-203",
    "m-204",
    "m-166",
    "m-167",
    "validate-before-overlay",
    "typed findings",
    "sealed graph",
    "advisory",
    "do not promise",
    "forbidden",
    "forbid",
    "agent_output_decisioning",
    "agent-output-decisioning",
    "decisionmergeinputgate",
    "rulebaseddecisionengine",
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "not sell",
    "not the signed",
    "does not",
    "does **not**",
    "forbidden",
    "forbid",
    "too strong",
    "review finding",
    "treat ",
    "unsafe",
    "advisory",
    "m-203",
    "m-204",
    "tb-1196",
    "tb-1197",
    "unvalidated-proposal-overlay-honesty: allow",
    '"agent',
    "“agent",
    '"pilotstrict',
    "“pilotstrict",
    "| ",
    "**forbid**",
    "≠",
    "not corruption-proof",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [
            f"{CONTRACT_REL.as_posix()}: missing agent→decisioning Real-variance contract (TB-1196)."
        ]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1197)."
        )
    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    if not path.is_file():
        return [f"{path.as_posix()}: missing buyer procurement packet (TB-1197)."]
    text = path.read_text(encoding="utf-8", errors="replace").lower()
    return [
        f"{path.relative_to(root).as_posix()}: missing procurement anchor {marker!r} (TB-1197)."
        for marker in REQUIRED_PROCUREMENT_ANCHORS
        if marker.lower() not in text
    ]


def _line_has_negation(line_lower: str, phrase: str) -> bool:
    idx = line_lower.find(phrase)
    if idx < 0:
        return False
    prefix = line_lower[:idx]
    return any(marker in prefix for marker in NEGATION_MARKERS)


def scan_text_file(root: Path, rel: Path, *, check_primary_claims: bool) -> list[str]:
    path = root / rel if not rel.is_absolute() else rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing unvalidated-proposal-overlay honesty scan target."]
    text = path.read_text(encoding="utf-8", errors="replace")
    display = path.relative_to(root).as_posix() if path.is_relative_to(root) else str(rel)
    violations: list[str] = []

    for line_no, line in enumerate(text.splitlines(), start=1):
        if ALLOWLIST_MARKER in line.lower():
            continue
        line_lower = line.lower()
        for phrase, message in FORBIDDEN_PHRASES:
            if phrase not in line_lower:
                continue
            if _line_has_negation(line_lower, phrase):
                continue
            violations.append(f"{display}:{line_no}: {message} Matched `{phrase}`.")

        for marker in PRIMARY_CLAIM_MARKERS:
            if not check_primary_claims:
                break

            if marker not in line_lower:
                continue

            if _line_has_negation(line_lower, marker):
                continue

            if not any(anchor in line_lower for anchor in TB_1196_ANCHOR_MARKERS):
                violations.append(
                    f"{display}:{line_no}: buyer agent-overlay language without TB-1196 anchor (TB-1197)."
                )
                break

    return violations


def unvalidated_proposal_overlay_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(
            scan_text_file(
                root,
                rel,
                check_primary_claims=rel in PRIMARY_CLAIM_SCAN,
            )
        )
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = unvalidated_proposal_overlay_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"unvalidated-proposal-overlay honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("unvalidated-proposal-overlay honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
