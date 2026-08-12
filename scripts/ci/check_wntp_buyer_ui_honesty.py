#!/usr/bin/env python3
"""TB-1344 / M-239: Anti-WNTP-forbidden-phrase / billing-checkout-theater honesty CI on buyer UI."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "wntp-buyer-ui-honesty: allow"

CONTRACT_REL = Path("docs/library/WHAT_NOT_TO_PROMISE_UI_BUYER_RISK_MATRIX_CONTRACT.md")

UI_SCAN_ROOTS: tuple[Path, ...] = (
    Path("archlucid-ui/src/lib/billing-help-guide-content.ts"),
    Path("archlucid-ui/src/components/reviews/RunDetailDeferredScopeNotice.tsx"),
    Path("archlucid-ui/src/components/reviews/RunDetailDeferredScopeNoticeClient.tsx"),
    Path("archlucid-ui/src/app/(marketing)/pricing"),
    Path("archlucid-ui/src/app/(marketing)/see-it"),
    Path("archlucid-ui/src/app/(marketing)/welcome"),
    Path("archlucid-ui/src/app/(marketing)/live-demo"),
    Path("archlucid-ui/src/app/(marketing)/why"),
)

UI_GLOB_EXCLUDES: tuple[str, ...] = (
    "*.test.ts",
    "*.test.tsx",
    "*.spec.ts",
    "*.spec.tsx",
    "help-index.generated.ts",
    "ui-route-traffic-",
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1343**",
    "**TB-1344**",
    "M-239",
    "CI anchors for **TB-1344**",
    "Forbidden without negation",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    ("soc 2 certified", "SOC 2 CPA attestation overclaim (M-239)."),
    ("pen test complete", "Third-party pen-test publication overclaim (M-239)."),
    ("third-party pen test complete", "Third-party pen-test publication overclaim (M-239)."),
    ("guaranteed savings", "Guaranteed ROI overclaim (M-239)."),
    ("guaranteed $ savings", "Guaranteed ROI overclaim (M-239)."),
    ("invoice-accurate cogs", "Invoice-accurate COGS overclaim (M-239)."),
    ("buy on marketplace today", "Live Marketplace checkout theater (M-239)."),
    ("connectors not in v1", "Stale V1_SCOPE deferral (TB-599)."),
    ("native jira/teams ga in v1", "Connector GA overclaim (M-239)."),
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not ",
    "never ",
    "without ",
    "deferred",
    "avoid ",
    "≠",
    "not invoice-accurate",
    "not guaranteed",
    "not soc 2",
    "self-assessment",
    "gtm-do-not-promise",
    "forbidden",
    "wntp",
    "m-239",
    "tb-1344",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing WNTP UI buyer-risk matrix contract (TB-1343)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1344)."
        )
    return violations


def _should_skip_ui_path(path: Path) -> bool:
    name = path.name.lower()
    if any(fragment in name for fragment in UI_GLOB_EXCLUDES):
        return True
    if "__tests__" in path.parts:
        return True
    return False


def _collect_ui_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for rel in UI_SCAN_ROOTS:
        path = root / rel
        if path.is_file():
            files.append(path)
            continue
        if path.is_dir():
            for candidate in path.rglob("*"):
                if not candidate.is_file():
                    continue
                if candidate.suffix.lower() not in (".ts", ".tsx"):
                    continue
                if _should_skip_ui_path(candidate):
                    continue
                files.append(candidate)
    return sorted(set(files))


def _line_has_negation(line_lower: str, phrase: str) -> bool:
    idx = line_lower.find(phrase)
    if idx < 0:
        return False
    prefix = line_lower[:idx]
    return any(marker in prefix for marker in NEGATION_MARKERS)


def scan_ui_file(root: Path, rel: Path) -> list[str]:
    path = root / rel if not rel.is_absolute() else rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing WNTP buyer UI scan target."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    display = path.relative_to(root).as_posix() if path.is_relative_to(root) else str(rel)
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
    return violations


def wntp_buyer_ui_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    for path in _collect_ui_files(root):
        violations.extend(scan_ui_file(root, path))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = wntp_buyer_ui_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"WNTP buyer UI honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("WNTP buyer UI honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
