#!/usr/bin/env python3
"""Restore UX scores (Scores position 2) from the 2026-08-08 audit pass."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))

from archlucid_ui_route_traffic_table import (
    DOC,
    EVIDENCE_INDEX,
    SCORE_DIMENSIONS,
    UX_INDEX,
    ensure_owner_workbook,
    find_row,
    parse_rows,
    parse_ux_score,
    set_score_dimension,
    sort_rows,
    split_document,
    write_table,
)

# Canonical UX scores from docs/architecture/UX_AUDIT_2026_08_08.md (2026-08-08 pass).
# Recreated from the owner batch file when that audit doc is not checked in.
_AUDIT_UX_SCORES: dict[str, int] = {
    "RE": 81,
    "RRE": 74,
    "RRF": 79,
    "ARE": 82,
    "ACB": 78,
    "ASI": 85,
    "ASK": 84,
    "HOM": 81,
    "AL": 78,
    "GFN": 76,
    "SCX": 72,
    "HEL": 77,
    "SET": 81,
    "PLA": 74,
    "SXX": 74,
    "GRA": 76,
    "ADY": 73,
    "RNX": 82,
    "AUD": 78,
    "ERU": 76,
    "GPP": 75,
    "GDO": 75,
    "GRO": 75,
    "GPI": 74,
    "RRP": 72,
    "CXX": 72,
    "SCE": 73,
    "P": 76,
    "SPE": 77,
    "ALE": 73,
    "GRX": 74,
    "HGX": 75,
    "SIG": 88,
    "FI": 75,
    "AUX": 74,
    "SAX": 74,
    "GAI": 73,
    "MMX": 76,
    "GRS": 74,
    "HCE": 73,
    "AHX": 66,
    "ASX": 77,
    "FXX": 76,
    "HC": 73,
    "HTX": 73,
    "SPR": 76,
    "ATX": 66,
    "GFX": 74,
    "HA": 73,
    "HFX": 73,
    "IJX": 73,
    "ISN": 73,
    "ITX": 73,
    "ACX": 66,
    "ARX": 64,
    "REP": 64,
    "SEC": 77,
    "TXX": 77,
    "SRI": 76,
    "GO": 73,
    "HR": 73,
    "ISX": 73,
    "AII": 66,
    "SVX": 77,
    "HBX": 73,
    "HP": 73,
    "SPP": 76,
    "IWX": 73,
    "DPX": 75,
    "HE": 73,
    "HGE": 73,
    "HOE": 73,
    "GXX": 75,
    "AD": 74,
    "COR": 73,
    "HSX": 73,
    "HSE": 73,
    "HUX": 73,
    "IIO": 73,
    "AEX": 65,
    "AFX": 65,
    "APX": 65,
    "ATD": 65,
    "QXX": 75,
    "SRH": 75,
    "TRY": 75,
    "WSX": 74,
    "H": 73,
    "HCX": 73,
    "HDX": 73,
    "HEF": 73,
    "PRO": 73,
    "LXX": 75,
    "SEE": 75,
    "WXX": 75,
    "WHY": 75,
    "WH": 74,
    "ASU": 77,
    "DEX": 74,
    "CON": 73,
    "HEX": 73,
    "HEE": 73,
    "EVI": 73,
    "EV": 73,
    "HFE": 73,
    "HG": 73,
    "PI": 73,
    "HRX": 73,
    "REV": 73,
    "4XX": 77,
    "AXX": 75,
    "ADS": 74,
    "ADI": 74,
    "ADP": 74,
    "ADU": 74,
    "ADA": 74,
    "ABI": 74,
    "ADC": 74,
    "SDX": 74,
    "ADX": 74,
    "AID": 74,
    "SEI": 74,
    "AOI": 74,
    "ADO": 74,
    "ASA": 74,
    "ASS": 74,
    "AMO": 74,
    "ADR": 74,
    "ASC": 74,
    "ATE": 74,
    "STR": 74,
    "SEU": 72,
    "SER": 72,
    "SSU": 72,
    "AIN": 75,
    "ARA": 75,
    "ARR": 75,
    "ANE": 75,
    "ARD": 74,
    "ARB": 74,
    "ARS": 74,
    "AIS": 74,
    "ARF": 74,
    "REA": 72,
    "REC": 72,
    "RED": 72,
    "REE": 72,
    "REF": 72,
    "REG": 72,
    "REO": 72,
    "REN": 80,
    "ENE": 80,
    "REQ": 80,
    "AUB": 77,
    "AUI": 77,
    "COM": 75,
    "ADT": 74,
    "GOC": 74,
    "GLR": 74,
    "GOS": 74,
    "GOP": 74,
    "SI": 74,
    "GAR": 74,
    "HAX": 73,
    "HAE": 73,
    "HEP": 73,
    "HEA": 73,
    "HEZ": 73,
    "ECA": 73,
    "HEC": 73,
    "HGC": 73,
    "CO": 73,
    "HER": 73,
    "HED": 73,
    "HDG": 73,
    "HDP": 73,
    "EXE": 73,
    "HEI": 73,
    "HPX": 73,
    "HPE": 73,
    "PIL": 73,
    "POL": 73,
    "HEO": 73,
    "HPR": 73,
    "HRE": 73,
    "HES": 73,
    "HS": 73,
    "HEU": 73,
    "INI": 74,
    "INL": 74,
    "INP": 74,
    "INA": 74,
    "INZ": 73,
    "INC": 73,
    "IAZ": 73,
    "IGC": 73,
    "ADD": 65,
    "ADE": 65,
    "OID": 65,
    "INR": 74,
    "INE": 65,
    "INT": 65,
    "PRB": 75,
}

# Retired workbook IDs folded into a live row — apply the audit score to the survivor.
_ID_REMAP: dict[str, str] = {
    "HEP": "HG",
    "HER": "HR",
    "HFE": "COR",
    "HEE": "HPX",
    "HUX": "HOE",
    "PIL": "HP",
}

# Owner overrides recorded after the bulk pass (docs/architecture/UX_AUDIT_2026_08_09.md).
_POST_AUDIT_OVERRIDES: dict[str, int] = {
    "SCX": 80,
    "ADY": 84,
}

# Rows first scored after the audit pass (no historical score in the batch file).
_POST_AUDIT_DEFAULTS: dict[str, int] = {
    "HCD": 74,
}


def _resolved_scores() -> dict[str, int]:
    resolved: dict[str, int] = dict(_AUDIT_UX_SCORES)

    for retired_id, live_id in _ID_REMAP.items():
        score = resolved.pop(retired_id, None)

        if score is None:
            continue

        existing = resolved.get(live_id, 0)

        if score > existing:
            resolved[live_id] = score

    resolved.update(_POST_AUDIT_DEFAULTS)
    resolved.update(_POST_AUDIT_OVERRIDES)
    return resolved


def restore_ux_scores(doc: Path, *, dry_run: bool = False, preserve_higher: bool = True) -> tuple[int, int, list[str]]:
    scores = _resolved_scores()
    text = doc.read_text(encoding="utf-8")
    before, table_body, after = split_document(text, doc)
    rows = parse_rows(table_body)
    by_id = {row["id"]: row for row in rows}
    applied = 0
    skipped_higher: list[str] = []

    for row_id, target in sorted(scores.items()):
        row = by_id.get(row_id)

        if row is None:
            continue

        current = parse_ux_score(row)

        if preserve_higher and current > target:
            skipped_higher.append(f"{row_id}:{current}>{target}")
            continue

        if current == target:
            continue

        set_score_dimension(row, UX_INDEX, target)
        applied += 1

    sorted_rows = sort_rows(rows)

    if not dry_run:
        write_table(doc, before, sorted_rows, after)

    return applied, len(scores), skipped_higher


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--doc",
        type=Path,
        default=DOC,
        help="Owner workbook path (default: .local/owner/ui_route_traffic_estimates.md)",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--no-preserve-higher",
        action="store_true",
        help="Overwrite rows whose current UX score is higher than the audit value",
    )
    args = parser.parse_args()

    doc = ensure_owner_workbook() if args.doc == DOC else args.doc.resolve()

    if not doc.is_file():
        print(f"restore-ui-route-traffic-ux-from-audit: missing {doc}", file=sys.stderr)
        return 1

    applied, source_count, skipped_higher = restore_ux_scores(
        doc,
        dry_run=args.dry_run,
        preserve_higher=not args.no_preserve_higher,
    )
    mode = "Would restore" if args.dry_run else "Restored"
    print(f"{mode} UX scores in {doc}")
    print(f"  source: 2026-08-08 audit pass ({source_count} row ID(s))")
    print(f"  rows updated: {applied}")

    if skipped_higher:
        print(f"  preserved higher scores: {', '.join(skipped_higher)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
