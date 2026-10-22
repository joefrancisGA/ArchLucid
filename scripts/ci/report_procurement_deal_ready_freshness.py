#!/usr/bin/env python3
"""Deal-ready procurement pack freshness classification (assessment Tier 2 #9)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.procurement-deal-ready-freshness.v1"
_LAST_REVIEWED = re.compile(r"\*\*Last reviewed:\*\*\s*(\d{4}-\d{2}-\d{2})", re.IGNORECASE)

_DEFERRED_SCOPE_DOCS = frozenset(
    {
        "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md",
        "docs/security/SOC2_SELF_ASSESSMENT_2026.md",
    }
)

_TARGETS: tuple[tuple[str, int, str], ...] = (
    ("docs/go-to-market/trust-center.md", 45, "required"),
    ("docs/go-to-market/PROCUREMENT_PACK_INDEX.md", 90, "required"),
    ("docs/go-to-market/SUBPROCESSORS.md", 90, "required"),
    ("docs/go-to-market/SLA_SUMMARY.md", 45, "required"),
    ("docs/go-to-market/SUPPORT_POLICY.md", 45, "required"),
    ("docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md", 120, "deferred-scope"),
    ("docs/security/SOC2_SELF_ASSESSMENT_2026.md", 120, "deferred-scope"),
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def classify_doc(root: Path, relative: str, max_age_days: int, bucket: str) -> dict[str, Any]:
    path = root / relative

    if not path.is_file():
        return {
            "path": relative,
            "classification": "MISSING",
            "bucket": bucket,
            "detail": "source file missing",
        }

    match = _LAST_REVIEWED.search(path.read_text(encoding="utf-8", errors="replace"))

    if match is None:
        return {
            "path": relative,
            "classification": "STALE",
            "bucket": bucket,
            "detail": "missing Last reviewed date",
        }

    reviewed = date.fromisoformat(match.group(1))
    age_days = (date.today() - reviewed).days

    if relative.replace("\\", "/") in _DEFERRED_SCOPE_DOCS:
        return {
            "path": relative,
            "classification": "DEFERRED_SCOPE",
            "bucket": bucket,
            "lastReviewed": reviewed.isoformat(),
            "ageDays": age_days,
            "detail": "V1.1 assurance item — transparent deferred scope, not a V1 engineering blocker",
        }

    if age_days > max_age_days:
        return {
            "path": relative,
            "classification": "STALE",
            "bucket": bucket,
            "lastReviewed": reviewed.isoformat(),
            "ageDays": age_days,
            "detail": f"{age_days} days old (max {max_age_days})",
        }

    return {
        "path": relative,
        "classification": "FRESH",
        "bucket": bucket,
        "lastReviewed": reviewed.isoformat(),
        "ageDays": age_days,
        "detail": "within freshness window",
    }


def build_summary(root: Path) -> dict[str, Any]:
    rows = [classify_doc(root, relative, max_age, bucket) for relative, max_age, bucket in _TARGETS]
    blocking = [row for row in rows if row["classification"] in {"MISSING", "STALE"} and row["bucket"] == "required"]
    disposition = "PASS" if not blocking else "WARN"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "documents": rows,
        "deferredScopeCount": sum(1 for row in rows if row["classification"] == "DEFERRED_SCOPE"),
        "interpretation": (
            "Buyer-unsafe placeholders fail as STALE/MISSING required docs. "
            "DEFERRED_SCOPE items (SOC 2 CPA roadmap, third-party pen test) must not reduce V1 headline readiness."
        ),
    }


def render_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# Procurement deal-ready freshness",
        "",
        f"**Disposition:** **{summary['disposition']}**",
        "",
        "| Document | Classification | Detail |",
        "| --- | --- | --- |",
    ]

    for row in summary["documents"]:
        lines.append(f"| `{row['path']}` | **{row['classification']}** | {row['detail']} |")

    lines.extend(["", str(summary["interpretation"]), ""])
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--deal-ready", action="store_true", help="Exit non-zero when required docs are STALE/MISSING.")
    args = parser.parse_args(argv)

    summary = build_summary(args.repo_root.resolve())

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(f"Procurement deal-ready freshness: {summary['disposition']}")

    if args.deal_ready and summary["disposition"] != "PASS":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
