#!/usr/bin/env python3
"""
Emit a Markdown readiness report for data consistency enforcement modes (repo-local, no DB).

Source material: docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md and runbook sibling.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def _read(rel: Path) -> str:
    p = REPO_ROOT / rel
    return p.read_text(encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out",
        type=Path,
        default=REPO_ROOT / "artifacts" / "deployment" / "data-consistency-mode-readiness.md",
        help="Markdown output path",
    )
    args = parser.parse_args()
    doc = _read(Path("docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md"))
    sql = REPO_ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid.sql"

    with_nocheck = "WITH NOCHECK" in doc
    modes_doc = all(m in doc for m in ("Warn", "Alert", "Quarantine", "AutoQuarantine"))
    sql_present = sql.is_file()

    rows: list[tuple[str, str, str]] = [
        (
            "Operator runbook present",
            "Passed" if (REPO_ROOT / "docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md").is_file() else "Failed",
            "`docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md`",
        ),
        (
            "Architecture doc references WITH NOCHECK brownfield posture",
            "Passed" if with_nocheck else "Failed",
            "docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md",
        ),
        (
            "Documented enforcement modes (Warn / Alert / Quarantine / AutoQuarantine)",
            "Passed" if modes_doc else "Failed",
            "Same doc — operator posture labels",
        ),
        (
            "Master SQL DDL file present for FK / quarantine review",
            "Passed" if sql_present else "Failed",
            str(sql.relative_to(REPO_ROOT)).replace("\\", "/"),
        ),
        (
            "Live orphan counts / quarantine safety",
            "Not captured",
            "Requires SQL connectivity and configured `DataConsistency:*` options — not asserted here.",
        ),
    ]

    args.out.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Data consistency mode readiness (repo-local)",
        "",
        "Generated for operators summarizing **documentation** and **schema file** presence only.",
        "",
        "| Check | Result | Detail |",
        "| --- | --- | --- |",
    ]
    for name, result, detail in rows:
        lines.append(f"| {name} | **{result}** | {detail} |")

    lines.extend(
        [
            "",
            "## Mode reference (from product doc)",
            "",
            "- **Warn** — detection counter + logs (historical behaviour).",
            "- **Alert** — emits `archlucid_data_consistency_alerts_total` when thresholds met.",
            "- **Quarantine / AutoQuarantine** — inserts into `dbo.DataConsistencyQuarantine` for batches of orphan rows "
            "(see doc for table scope).",
            "",
            "**`WITH NOCHECK`:** brownfield installs allow adding FKs without failing validation on historical orphans; "
            "new writes must still honor parent `dbo.Runs` — see `docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md`.",
            "",
            "Do not treat this file as permission to enable quarantine without runbook sign-off.",
        ]
    )

    args.out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
