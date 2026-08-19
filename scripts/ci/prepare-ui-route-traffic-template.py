#!/usr/bin/env python3
"""Build the tracked bootstrap template for the owner UI route traffic workbook."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    LEGACY_DOC,
    REPO_ROOT,
    TEMPLATE_DOC,
    format_overall_weight_total,
    parse_rows,
    render_table,
    sort_rows,
    split_document,
    update_method_line,
    upsert_overall_weight_line,
)

# Last commit that tracked the legacy workbook before master deletion.
_SOURCE_COMMIT = "7f1bfe33ed"
_SOURCE_PATH = "docs/architecture/ui_route_traffic_estimates.md"


def _load_source_text() -> str:
    if LEGACY_DOC.is_file():
        return LEGACY_DOC.read_text(encoding="utf-8")

    return subprocess.check_output(
        ["git", "show", f"{_SOURCE_COMMIT}:{_SOURCE_PATH}"],
        cwd=REPO_ROOT,
        text=True,
    )


def _normalize_template(text: str) -> str:
    updated = text.replace("(127 page.tsx", "(126 page.tsx")
    updated = re.sub(r"\| POR \| `\/portfolio` \|[^\n]+\n", "", updated)

    if "Row Weight is Hit% × Evidence score." not in updated:
        updated = updated.replace(
            "until the owner assigns a value.",
            "until the owner assigns a value. Row Weight is Hit% × Evidence score.\n"
            "OVERALL WEIGHT SCORE is that sum expressed as a percentage of the maximum\n"
            "possible (Hit% × 100 per row).",
        )

    before, table_body, after = split_document(updated, TEMPLATE_DOC)
    rows = parse_rows(table_body)

    for row in rows:
        row["score"] = "0"
        row["notes"] = "None"

    rows = sort_rows(rows)
    before = update_method_line(before)
    before = upsert_overall_weight_line(before, rows)
    table = "\n".join(render_table(rows))
    return before + table + "\n\n---\n" + after


def main() -> int:
    try:
        source = _load_source_text()
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        print(f"Failed to load legacy workbook source: {exc}", file=sys.stderr)
        return 1

    TEMPLATE_DOC.parent.mkdir(parents=True, exist_ok=True)
    TEMPLATE_DOC.write_text(_normalize_template(source), encoding="utf-8")
    print(f"Wrote {TEMPLATE_DOC.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
