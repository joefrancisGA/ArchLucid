#!/usr/bin/env python3
"""Map SecureNow UI rate paths to owner workbook IDs and current Evidence/UX scores."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
WORKBOOK = REPO / ".local" / "owner" / "ui_route_traffic_estimates.md"

GOVERNANCE_TO_SECURENOW: dict[str, str] = {
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
    row_re = re.compile(
        r"^\|\s*([A-Z0-9]{2,4})\s*\|\s*`([^`]+)`\s*\|[^|]+\|\s*([^,|]+),\s*([^|]+)\|",
        re.MULTILINE,
    )
    for match in row_re.finditer(text):
        row_id = match.group(1)
        path = match.group(2).strip()
        evidence = int(match.group(3).strip().split(",")[0].strip() or "0")
        ux = int(match.group(4).strip().split(",")[0].strip() or "0")
        by_path[path] = (row_id, evidence, ux)

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
