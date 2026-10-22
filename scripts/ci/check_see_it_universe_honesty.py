#!/usr/bin/env python3
"""TB-1029 / M-178: Anti-see-it Claims-banner-Contoso-payload honesty CI.

Fails dishonest stubs that:
- Pair Healthcare Claims / claims-intake chrome with Contoso preview routes or run ids on `/see-it`.
- Deep-link `/demo/preview` from primary `/see-it` marketing surfaces.
- Claim Contoso SQL rename / Option D is required before the minimum welcome→see-it funnel bar.
- Omit TB-1028/TB-1029 enforcement anchors from the marketing static-vs-live contract.

Contract: docs/library/MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md (TB-1028 / TB-1029).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "see-it-universe-honesty: allow"

CONTRACT_REL = Path("docs/library/MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md")

SEE_IT_SCAN_ROOT = Path("archlucid-ui/src/app/(marketing)/see-it")

EXTRA_SCAN_FILES: tuple[Path, ...] = (
    Path("archlucid-ui/src/lib/see-it-page-copy.ts"),
    Path("archlucid-ui/src/lib/see-it-evidence-copy.ts"),
    Path("archlucid-ui/src/app/(marketing)/see-it/see-it-demo-universe.ts"),
)

GLOB_EXCLUDES: tuple[str, ...] = (
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
    ".fixtures.ts",
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1028**",
    "**TB-1029**",
    "Enterprise customer intake",
    "check_see_it_universe_honesty.py",
    "see-it-universe-honesty.test.ts",
)

FORBIDDEN_SEE_IT_PHRASES: tuple[tuple[str, str], ...] = (
    ("healthcare claims intake modernization", "Healthcare Claims hero chrome on primary /see-it (TB-1029)."),
    ("healthcare claims sample", "Healthcare claims banner on primary /see-it without claims-intake scenario guard (TB-1029)."),
)

FORBIDDEN_SEE_IT_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r'href\s*=\s*["\']/demo/preview["\']'), "Contoso /demo/preview deep link on /see-it (TB-1028)."),
    (re.compile(r"see-it-cta-demo-preview"), "Contoso preview CTA test id on /see-it (TB-1028)."),
    (
        re.compile(r"must rename (contoso|sql).*before.*funnel", re.IGNORECASE),
        "Overclaim that Contoso SQL rename is required before minimum funnel honesty (TB-1029).",
    ),
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not ",
    "without ",
    "forbidden",
    "fail closed",
    "claims-intake",
    "secondary",
    "regulated-depth",
    "tb-1029",
    "tb-1028",
    "see-it-universe-honesty: allow",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing marketing static-vs-live boundary contract (TB-1028)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1029)."
        )
    return violations


def _should_skip(path: Path) -> bool:
    name = path.name.lower()
    return any(fragment in name for fragment in GLOB_EXCLUDES)


def _collect_see_it_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for rel in EXTRA_SCAN_FILES:
        path = root / rel
        if path.is_file():
            files.append(path)
    scan_root = root / SEE_IT_SCAN_ROOT
    if scan_root.is_dir():
        for candidate in scan_root.rglob("*"):
            if not candidate.is_file():
                continue
            if candidate.suffix.lower() not in (".ts", ".tsx"):
                continue
            if _should_skip(candidate):
                continue
            files.append(candidate)
    return sorted(set(files))


def _line_has_negation(line_lower: str, phrase: str) -> bool:
    idx = line_lower.find(phrase)
    if idx < 0:
        return False
    prefix = line_lower[:idx]
    return any(marker in prefix for marker in NEGATION_MARKERS)


def scan_see_it_file(root: Path, path: Path) -> list[str]:
    if path.name == "see-it-demo-universe.ts":
        return []
    text = path.read_text(encoding="utf-8", errors="replace")
    display = path.relative_to(root).as_posix() if path.is_relative_to(root) else str(path)
    violations: list[str] = []
    for line_no, line in enumerate(text.splitlines(), start=1):
        if ALLOWLIST_MARKER in line.lower():
            continue
        line_lower = line.lower()
        for phrase, message in FORBIDDEN_SEE_IT_PHRASES:
            if phrase not in line_lower:
                continue
            if "claims-intake" in line_lower:
                continue
            if _line_has_negation(line_lower, phrase):
                continue
            violations.append(f"{display}:{line_no}: {message} Matched `{phrase}`.")
        for pattern, message in FORBIDDEN_SEE_IT_PATTERNS:
            if not pattern.search(line):
                continue
            if any(marker in line_lower for marker in NEGATION_MARKERS):
                continue
            violations.append(f"{display}:{line_no}: {message}")
    return violations


def structural_violations(root: Path) -> list[str]:
    violations: list[str] = []
    universe_path = root / "archlucid-ui/src/app/(marketing)/see-it/see-it-demo-universe.ts"
    if not universe_path.is_file():
        return violations
    text = universe_path.read_text(encoding="utf-8", errors="replace")
    if "claims-intake" not in text:
        violations.append(
            f"{universe_path.relative_to(root).as_posix()}: missing claims-intake scenario guard before healthcare banner (TB-1029)."
        )
    if "Enterprise customer intake sample" not in text:
        violations.append(
            f"{universe_path.relative_to(root).as_posix()}: missing primary customer-intake banner title (TB-1029)."
        )
    return violations


def see_it_universe_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(structural_violations(root))
    for path in _collect_see_it_files(root):
        violations.extend(scan_see_it_file(root, path))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = see_it_universe_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"see-it universe honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("see-it universe honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
