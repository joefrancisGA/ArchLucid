#!/usr/bin/env python3
"""
Brand-category seam guard: surfaces outside `archlucid-ui/src/lib/brand-category.ts`
must not hardcode historical buyer-facing category phrases. Prefer importing
`BRAND_CATEGORY` (and legacy constants where redirects/metadata require them).

Workstreams:
  - 2026-04-23: Intelligence -> Review Board (see superseded tracker).
  - 2026-05-07: Review Board -> Architecture Proof Engine (`docs/architecture/REBRAND_WORKSTREAM_2026_05_07.md`).

Default mode is **WARN** (exit 0, offenders on stderr). PR closing passes `--fail`
and wires `--fail` in `.github/workflows/ci.yml`.

Scoped paths mirror historical coverage plus PRODUCT_PACKAGING and exec/competitive docs.

Allow-list:
  - The seam file itself (`brand-category.ts`) may export legacy literals.

Escape hatch (per scoped file):
  - Mention of any forbidden phrase is OK if the file body references at least one
    identifier substring among `BRAND_CATEGORY_LEGACY`, `BRAND_CATEGORY_LEGACY_ORIGINAL`
    (typically via imports from the seam — used for SEO metadata / redirects).

Self-test: `scripts/ci/tests/test_assert_brand_category_seam.py`.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

# Exact literals buyers once saw as category labels — forbid loose duplication outside seam.
LEGACY_PHRASES: tuple[str, ...] = (
    "AI Architecture Intelligence",
    "AI Architecture Review Board",
)

ESCAPE_MARKERS: tuple[str, ...] = (
    "BRAND_CATEGORY_LEGACY",
    "BRAND_CATEGORY_LEGACY_ORIGINAL",
)

SEAM_RELATIVE_PATH = Path("archlucid-ui") / "src" / "lib" / "brand-category.ts"

REPO_ROOT_DEFAULT = Path(__file__).resolve().parents[2]


def _is_text_file(path: Path) -> bool:
    if not path.is_file():
        return False

    suffix = path.suffix.lower()
    return suffix in {".ts", ".tsx", ".js", ".jsx", ".md", ".mdx", ".html", ".json"}


def _iter_app_files(app_root: Path) -> Iterable[Path]:
    if not app_root.is_dir():
        return

    for path in sorted(app_root.rglob("*")):
        if _is_text_file(path):
            yield path


def _iter_brief_files(briefs_root: Path) -> Iterable[Path]:
    if not briefs_root.is_dir():
        return

    for path in sorted(briefs_root.rglob("brief.md")):
        if path.is_file():
            yield path


def collect_in_scope_files(repo_root: Path) -> list[Path]:
    """Build the canonical scan list for rebrand surfaces."""

    files: list[Path] = []

    files.extend(_iter_app_files(repo_root / "archlucid-ui" / "src" / "app"))

    fixed_doc_paths = [
        repo_root / "docs" / "EXECUTIVE_SPONSOR_BRIEF.md",
        repo_root / "docs" / "go-to-market" / "COMPETITIVE_LANDSCAPE.md",
        repo_root / "docs" / "trust-center.md",
        repo_root / "docs" / "library" / "PRODUCT_PACKAGING.md",
    ]

    for path in fixed_doc_paths:
        if path.is_file():
            files.append(path)

    files.extend(_iter_brief_files(repo_root / "templates" / "briefs"))

    return files


def file_is_seam(path: Path, repo_root: Path) -> bool:
    try:
        rel = path.relative_to(repo_root)
    except ValueError:
        return False

    return Path(*rel.parts) == SEAM_RELATIVE_PATH


def file_is_offender(path: Path, repo_root: Path) -> bool:
    """Offender if any legacy phrase appears outside seam without escape markers."""

    if file_is_seam(path, repo_root):
        return False

    text = path.read_text(encoding="utf-8", errors="ignore")

    if not any(p in text for p in LEGACY_PHRASES):
        return False

    if any(marker in text for marker in ESCAPE_MARKERS):
        return False

    return True


def find_offenders(repo_root: Path) -> list[Path]:
    return [p for p in collect_in_scope_files(repo_root) if file_is_offender(p, repo_root)]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=REPO_ROOT_DEFAULT,
        help="Repo root to scan (defaults to two levels above this script). Tests override this.",
    )
    parser.add_argument(
        "--fail",
        action="store_true",
        help="Exit non-zero on any offender. Default is WARN mode (stderr message, exit 0).",
    )
    args = parser.parse_args(argv)

    seam_path = args.repo_root / SEAM_RELATIVE_PATH

    if not seam_path.is_file():
        print(
            f"assert_brand_category_seam: seam file missing at {seam_path} — "
            "ship brand-category.ts first.",
            file=sys.stderr,
        )
        return 1

    offenders = find_offenders(args.repo_root)

    if not offenders:
        print(
            "assert_brand_category_seam: OK - no hardcoded legacy category phrases "
            "outside the seam in scoped surfaces."
        )
        return 0

    mode_label = "FAIL" if args.fail else "WARN"

    print(
        f"assert_brand_category_seam: {mode_label} — {len(offenders)} file(s) still "
        f"hardcode a legacy category phrase. Replace with `BRAND_CATEGORY` imports or "
        f"documented escape markers ({', '.join(ESCAPE_MARKERS)}) from "
        f"{SEAM_RELATIVE_PATH.as_posix()}:",
        file=sys.stderr,
    )

    for offender in offenders:
        try:
            rel = offender.relative_to(args.repo_root)
        except ValueError:
            rel = offender
        print(f"  - {rel.as_posix()}", file=sys.stderr)

    if args.fail:
        return 1

    print(
        "assert_brand_category_seam: returning 0 (WARN mode). "
        "Pass --fail (or enable CI fail) to make this merge-blocking.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
