#!/usr/bin/env python3
"""Map SecureNow UI rate paths to owner workbook IDs and current Evidence/UX scores."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import parse_rows, split_document

REPO = Path(__file__).resolve().parents[2]
WORKBOOK = REPO / ".local" / "owner" / "ui_route_traffic_estimates.md"

GOVERNANCE_TO_SECURENOW: dict[str, str] = {
    "/help/cloud-connections/azure": "/help/cloud-connections-azure",
    "/help/policy-packs#policy-pack-delta-demo": "/help/policy-pack-delta-demo",
    "/governance/policy-packs": "/compliance/policy-packs",
    "/governance/standards-and-rules": "/compliance/standards-and-rules",
    "/governance/findings": "/compliance/findings",
    "/governance/audit-evidence": "/compliance/audit-evidence",
    "/governance/findings/assigned-to-me": "/security/assigned-to-me",
    "/governance/remediation-factory": "/security/remediation-factory",
    "/governance/remediation-patterns": "/security/remediation-patterns",
    "/governance/infrastructure/remediation": "/security/remediation-instances",
    "/governance/infrastructure": "/infrastructure",
    "/governance/infrastructure/drift": "/infrastructure/drift",
    "/governance/infrastructure/terraform": "/infrastructure/terraform",
    "/governance/infrastructure/diagrams": "/infrastructure/diagrams",
    "/governance/infrastructure/diagram-reconcile": "/infrastructure/diagram-reconcile",
    "/governance/infrastructure/resources": "/infrastructure/resources",
    "/governance/infrastructure/declared-connections": "/infrastructure/declared-connections",
    "/governance/infrastructure/ask": "/infrastructure/ask",
    "/governance/infrastructure/extract-upload": "/infrastructure/extract-upload",
}


def _load_workbook_rows() -> dict[str, tuple[str, int, int]]:
    if not WORKBOOK.is_file():
        return {}

    text = WORKBOOK.read_text(encoding="utf-8", errors="replace")
    by_path: dict[str, tuple[str, int, int]] = {}
    _, table_body, _ = split_document(text, WORKBOOK)
    for row in parse_rows(table_body):
        score_parts = [int(part.strip() or "0") for part in row["score"].split(",")]
        evidence = score_parts[0] if score_parts else 0
        ux = score_parts[1] if len(score_parts) > 1 else evidence
        by_path[row["path"]] = (row["id"], evidence, ux)

    return by_path


def lookup_workbook(path: str, by_path: dict[str, tuple[str, int, int]]) -> tuple[str | None, int | None, int | None]:
    if path in by_path:
        row_id, evidence, ux = by_path[path]
        return row_id, evidence, ux

    for gov, sn in GOVERNANCE_TO_SECURENOW.items():
        if sn == path and gov in by_path:
            row_id, evidence, ux = by_path[gov]
            return row_id, evidence, ux

    return None, None, None


def main() -> int:
    import json

    routes = json.loads(
        subprocess.check_output(
            [sys.executable, str(REPO / "scripts" / "ci" / "list-securenow-ui-rate-routes.py"), "--json"],
            text=True,
        )
    )
    by_path = _load_workbook_rows()
    print("| href | workbook ID | UX (workbook) | Evidence (workbook) |")
    print("| --- | --- | --- | --- |")
    for route in routes:
        href = route["href"]
        row_id, evidence, ux = lookup_workbook(href, by_path)
        print(
            f"| `{href}` | {row_id or '—'} | {ux if ux is not None else '—'} | {evidence if evidence is not None else '—'} |"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
