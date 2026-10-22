#!/usr/bin/env python3
"""
Accessibility route evidence freshness guard (Batch E / improvement #21).

Validates:
  - ACCESSIBILITY.md contains Last reviewed and priority route table.
  - Each priority route is covered by live-api-accessibility.spec.ts PAGES (with /runs ↔ /reviews aliases).
  - Marketing /accessibility route is in the Playwright PAGES list.
  - Declared PAGES count in ACCESSIBILITY.md matches the spec array length (drift guard).

Exit codes:
  0 — OK (warnings may print to stderr when --warn-stale).
  1 — priority route missing from PAGES, count drift, or missing marketing route.
  2 — malformed ACCESSIBILITY.md (missing Last reviewed or table).
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path


PRIORITY_TABLE_HEADER = "### Pages with automated checks"
LAST_REVIEWED_RE = re.compile(r"Last reviewed:\s*(\d{4}-\d{2}-\d{2})", re.IGNORECASE)
PAGES_COUNT_RE = re.compile(r"\(\*\*(\d+)\*\* URL patterns as of", re.IGNORECASE)
PRIORITY_ROUTE_RE = re.compile(r"^\|\s[^|]+\|\s`([^`]+)`\s\|", re.MULTILINE)
SPEC_PAGES_BLOCK_RE = re.compile(
    r"const PAGES\s*=\s*\[(.*?)\]\s*as const;",
    re.DOTALL,
)
SPEC_PATH_RE = re.compile(r"path:\s*(?:`([^`]+)`|\"([^\"]+)\")")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def normalize_route(route: str) -> str:
    path = route.strip()

    if "?" in path:
        path = path.split("?", 1)[0]

    if path.endswith("/") and path != "/":
        path = path.rstrip("/")

    return path


def route_aliases(normalized: str) -> set[str]:
    aliases = {normalized}

    if normalized.startswith("/runs/"):
        aliases.add("/reviews/" + normalized[len("/runs/") :])

    if normalized.startswith("/reviews/"):
        aliases.add("/runs/" + normalized[len("/reviews/") :])

    if normalized == "/runs/new":
        aliases.add("/reviews/new")

    if normalized == "/reviews/new":
        aliases.add("/runs/new")

    if normalized == "/runs":
        aliases.add("/reviews")

    if normalized == "/reviews":
        aliases.add("/runs")

    return aliases


def priority_route_matches_pages(priority_route: str, page_paths: set[str]) -> bool:
    normalized = normalize_route(priority_route)

    if "{" in normalized:
        prefix = normalized.split("{", 1)[0].rstrip("/")
        prefix_aliases = route_aliases(prefix) if prefix else {prefix}

        for page_path in page_paths:
            page_normalized = normalize_route(page_path)

            for pfx in prefix_aliases:
                if page_normalized.startswith(pfx + "/") or page_normalized == pfx:
                    return True

        return False

    aliases = route_aliases(normalized)

    for alias in aliases:
        if alias in page_paths:
            return True

    return False


def parse_last_reviewed(text: str) -> date | None:
    match = LAST_REVIEWED_RE.search(text)

    if match is None:
        return None

    try:
        return datetime.strptime(match.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc).date()
    except ValueError:
        return None


def parse_priority_routes(text: str) -> list[str]:
    start = text.find(PRIORITY_TABLE_HEADER)

    if start < 0:
        return []

    sub = text[start:]
    end = sub.find("\n## ")

    if end > 0:
        sub = sub[:end]

    return [m.group(1).strip() for m in PRIORITY_ROUTE_RE.finditer(sub)]


def extract_spec_page_paths(spec_text: str) -> list[str]:
    block_match = SPEC_PAGES_BLOCK_RE.search(spec_text)

    if block_match is None:
        return []

    block = block_match.group(1)
    paths: list[str] = []

    for match in SPEC_PATH_RE.finditer(block):
        path = match.group(1) or match.group(2)

        if path is not None:
            paths.append(path)

    return paths


def parse_declared_pages_count(text: str) -> int | None:
    match = PAGES_COUNT_RE.search(text)

    if match is None:
        return None

    return int(match.group(1))


def run_guard(*, warn_stale_days: int = 180, fail_stale_days: int = 365) -> int:
    root = repo_root()
    accessibility_path = root / "ACCESSIBILITY.md"
    spec_path = root / "archlucid-ui" / "e2e" / "live-api-accessibility.spec.ts"

    if not accessibility_path.is_file():
        print(f"assert_accessibility_route_evidence_freshness: missing {accessibility_path}", file=sys.stderr)
        return 2

    if not spec_path.is_file():
        print(f"assert_accessibility_route_evidence_freshness: missing {spec_path}", file=sys.stderr)
        return 2

    accessibility_text = accessibility_path.read_text(encoding="utf-8")
    spec_text = spec_path.read_text(encoding="utf-8")

    last_reviewed = parse_last_reviewed(accessibility_text)

    if last_reviewed is None:
        print(
            "assert_accessibility_route_evidence_freshness: ACCESSIBILITY.md must contain Last reviewed: YYYY-MM-DD.",
            file=sys.stderr,
        )
        return 2

    today = datetime.now(timezone.utc).date()
    age_days = (today - last_reviewed).days

    if age_days > fail_stale_days:
        print(
            f"assert_accessibility_route_evidence_freshness: Last reviewed {last_reviewed.isoformat()} "
            f"is {age_days} days old (fail threshold {fail_stale_days}).",
            file=sys.stderr,
        )
        return 1

    if age_days > warn_stale_days:
        print(
            f"WARN: ACCESSIBILITY.md Last reviewed {last_reviewed.isoformat()} is {age_days} days old "
            f"(warn threshold {warn_stale_days}).",
            file=sys.stderr,
        )

    priority_routes = parse_priority_routes(accessibility_text)

    if len(priority_routes) == 0:
        print(
            "assert_accessibility_route_evidence_freshness: could not parse priority route table "
            f"({PRIORITY_TABLE_HEADER!r}).",
            file=sys.stderr,
        )
        return 2

    spec_paths = extract_spec_page_paths(spec_text)

    if len(spec_paths) == 0:
        print(
            "assert_accessibility_route_evidence_freshness: could not parse PAGES paths from Playwright spec.",
            file=sys.stderr,
        )
        return 2

    page_path_set = {normalize_route(path) for path in spec_paths}
    page_path_set_with_query = set(spec_paths)

    missing: list[str] = []

    for route in priority_routes:
        if not priority_route_matches_pages(route, page_path_set):
            missing.append(route)

    if missing:
        print(
            "assert_accessibility_route_evidence_freshness: priority routes missing from live-api-accessibility PAGES:",
            file=sys.stderr,
        )

        for route in missing:
            print(f"  - {route}", file=sys.stderr)

        return 1

    if "/accessibility" not in page_path_set and not any(
        p.startswith("/accessibility") for p in page_path_set_with_query
    ):
        print(
            "assert_accessibility_route_evidence_freshness: marketing route /accessibility must appear in PAGES.",
            file=sys.stderr,
        )
        return 1

    declared_count = parse_declared_pages_count(accessibility_text)
    actual_count = len(spec_paths)

    if declared_count is not None and declared_count != actual_count:
        print(
            f"assert_accessibility_route_evidence_freshness: ACCESSIBILITY.md declares {declared_count} PAGES entries "
            f"but live-api-accessibility.spec.ts const PAGES has {actual_count}. Update the doc count.",
            file=sys.stderr,
        )
        return 1

    if "participant" in accessibility_text.lower() and "does not imply" not in accessibility_text.lower():
        print(
            "WARN: ACCESSIBILITY.md mentions participant testing without an explicit non-implication disclaimer.",
            file=sys.stderr,
        )

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Accessibility route evidence freshness guard.")
    parser.add_argument(
        "--warn-stale-days",
        type=int,
        default=180,
        help="Emit stderr warning when Last reviewed is older than this many days (default 180).",
    )
    parser.add_argument(
        "--fail-stale-days",
        type=int,
        default=365,
        help="Fail when Last reviewed is older than this many days (default 365).",
    )

    args = parser.parse_args()

    return run_guard(warn_stale_days=args.warn_stale_days, fail_stale_days=args.fail_stale_days)


if __name__ == "__main__":
    raise SystemExit(main())
