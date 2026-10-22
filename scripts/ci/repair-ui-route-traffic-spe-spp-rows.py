#!/usr/bin/env python3
"""Repair SPE/SPP/EXE row-id drift after sponsor-report / pilot-outcomes split."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    REPO_ROOT,
    TEMPLATE_DOC,
    parse_rows,
    sort_rows,
    split_document,
    write_table,
)

OWNER_DOC = REPO_ROOT / ".local/owner/ui_route_traffic_estimates.md"

PILOT_OUTCOMES_NOTE = (
    "Pilot outcomes (Sponsor report) - PilotValueReportPageView with PageContextualHelpButton "
    "(topic map pilot-outcomes; Category-1 registry), PilotOutcomesEvidenceOrientationStrip "
    "(workspace Sources + claim-discipline: pilot outcomes only), Outcomes nav. "
    "Sibling SPE = /insights/sponsor-report; HPO = /help/pilot-outcomes. "
    "Period pilot outcomes - not a signed-record Sources trail alone. "
    "Score 68/100 (2026-08-08) - pilot outcomes launcher at SPE Evidence band; "
    "hard-caps higher Evidence without signed-record diligence Sources trail. "
    "Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning "
    "this into a sealed-record diligence Sources trail."
)

SPONSOR_SUMMARY_NOTE = (
    "Sponsor report (Sponsor report) - PilotValueReportPageClient/View with PageContextualHelpButton "
    "(topic map sponsor-report; Category-1 registry on /sponsor-report + /value-report), "
    "Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), "
    "reporting-period narrative plus DOCX and board-pack exports, Outcomes nav. "
    "Absorbs former VXX hit share from retired legacy `/value-report` bookmark row "
    "(no HTTP redirect; IA batch 4). Period summary - not a signed-record Sources trail alone. "
    "Score 68/100 (2026-08-08) - period summary at ARE sponsor Evidence band; "
    "hard-caps higher Evidence without sealed-record diligence Sources trail. "
    "Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning "
    "this into a sealed-record diligence Sources trail."
)


def repair_rows(rows: list[dict[str, str]], *, owner: bool) -> list[str]:
    changes: list[str] = []

    ipi_pilot = next(
        (row for row in rows if row["id"] == "IPI" and row["path"] == "/insights/pilot-outcomes"),
        None,
    )
    spp = next((row for row in rows if row["id"] == "SPP"), None)

    if ipi_pilot is not None and spp is None:
        changes.append("IPI -> SPP on /insights/pilot-outcomes")
        ipi_pilot["id"] = "SPP"
        spp = ipi_pilot
        if owner and ipi_pilot.get("notes") in (None, "", "None"):
            ipi_pilot["notes"] = PILOT_OUTCOMES_NOTE

    if any(row["id"] == "IPI" for row in rows):
        rows = [row for row in rows if row["id"] != "IPI"]
        changes.append("removed duplicate IPI row for /insights/pilot-outcomes")

    spp = next((row for row in rows if row["id"] == "SPP"), None)
    if spp is not None and spp["path"] != "/insights/pilot-outcomes":
        changes.append(f"SPP path {spp['path']} -> /insights/pilot-outcomes")
        spp["path"] = "/insights/pilot-outcomes"
        if owner and "pilot-roi-model" in (spp.get("notes") or ""):
            spp["notes"] = PILOT_OUTCOMES_NOTE

    ins = next((row for row in rows if row["id"] == "INS"), None)
    if ins is not None and ins["path"] == "/insights/sponsor-report":
        changes.append("INS -> SPE on /insights/sponsor-report")
        ins["id"] = "SPE"
        ins["pct"] = "0.22%"
        if not owner or ins.get("notes") in (None, "", "None"):
            ins["notes"] = SPONSOR_SUMMARY_NOTE

    spe = next((row for row in rows if row["id"] == "SPE"), None)
    if spe is None:
        rows.append(
            {
                "id": "SPE",
                "path": "/insights/sponsor-report",
                "pct": "0.22%",
                "score": "55" if owner else "0",
                "section": "Sponsor report",
                "done": "No",
                "notes": SPONSOR_SUMMARY_NOTE if owner else "None",
            }
        )
        changes.append("added missing SPE row for /insights/sponsor-report")

    esp = next((row for row in rows if row["id"] == "ESP"), None)
    if esp is not None and esp["path"] == "/help/sponsor-report":
        changes.append("ESP -> EXE on /help/sponsor-report")
        esp["id"] = "EXE"

    return changes


def repair_document(doc: Path) -> list[str]:
    owner = doc.resolve() == OWNER_DOC.resolve()
    text = doc.read_text(encoding="utf-8")
    before, table_body, after = split_document(text, doc)
    rows = parse_rows(table_body)
    changes = repair_rows(rows, owner=owner)

    if not changes:
        return changes

    write_table(doc, before, sort_rows(rows), after)
    return changes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--doc", type=Path, action="append")
    args = parser.parse_args()
    docs = args.doc or [OWNER_DOC, TEMPLATE_DOC]

    exit_code = 0
    for doc in docs:
        resolved = doc.resolve()
        if not resolved.is_file():
            print(f"repair-ui-route-traffic-spe-spp-rows: missing {resolved}", file=sys.stderr)
            exit_code = 1
            continue

        changes = repair_document(resolved)
        if changes:
            print(f"Repaired {resolved.relative_to(REPO_ROOT)}:")
            for change in changes:
                print(f"  - {change}")
        else:
            print(f"No SPE/SPP/EXE repairs needed for {resolved.relative_to(REPO_ROOT)}")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
