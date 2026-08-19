#!/usr/bin/env python3
"""Check deployed-environment evidence freshness (T2-7)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import repo_root  # noqa: E402

_STALE_DAYS = 14
_DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")


def parse_date(text: str) -> date | None:
    match = _DATE_RE.search(text)

    if not match:
        return None

    return date.fromisoformat(match.group(1))


def evaluate(paths: list[Path]) -> dict[str, object]:
    rows: list[dict[str, object]] = []
    today = date.today()

    for path in paths:
        if not path.is_file():
            rows.append({"path": str(path), "status": "MISSING"})
            continue

        captured = parse_date(path.read_text(encoding="utf-8", errors="replace"))
        days_old = (today - captured).days if captured else None
        status = "PASS"

        if captured is None:
            status = "WARN"
        elif days_old is not None and days_old > _STALE_DAYS:
            status = "STALE"

        rows.append(
            {
                "path": str(path),
                "status": status,
                "capturedDate": captured.isoformat() if captured else None,
                "daysOld": days_old,
            }
        )

    disposition = "PASS"

    if any(row["status"] == "STALE" for row in rows):
        disposition = "HOLD"
    elif any(row["status"] in {"WARN", "MISSING"} for row in rows):
        disposition = "WARN"

    return {
        "schema": "archlucid.deployed-evidence-freshness.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "staleAfterDays": _STALE_DAYS,
        "disposition": disposition,
        "artifacts": rows,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifacts-dir", type=Path, default=repo_root() / "artifacts" / "staging-readiness")
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args(argv)
    directory = args.artifacts_dir.resolve()
    paths = sorted(directory.glob("staging-readiness-*.md")) if directory.is_dir() else []
    summary = evaluate(paths)

    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(summary, indent=2))

    if summary["disposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
