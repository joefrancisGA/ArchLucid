#!/usr/bin/env python3
"""Generate scripts/ci/data/tenant_scoped_tables.v1.json from the classification matrix."""

from __future__ import annotations

import json
import re
from pathlib import Path

MATRIX_PATH = Path("docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md")
OUTPUT_PATH = Path("scripts/ci/data/tenant_scoped_tables.v1.json")
BACKTICK_TABLE_PATTERN = re.compile(r"`(?:dbo\.)?([A-Za-z_][A-Za-z0-9_]*)`")
VALID = {"scope-triple-on-row", "tenant-id-on-row"}


def main() -> None:
    text = MATRIX_PATH.read_text(encoding="utf-8")
    triple: list[str] = []
    tenant: list[str] = []

    for line in text.splitlines():
        stripped = line.strip()

        if not stripped.startswith("|"):
            continue

        cells = [cell.strip() for cell in stripped.strip("|").split("|")]

        if len(cells) < 2:
            continue

        classification = cells[0].strip("`")

        if classification not in VALID:
            continue

        for table in BACKTICK_TABLE_PATTERN.findall(cells[1]):
            normalized = f"dbo.{table}"

            if classification == "scope-triple-on-row":
                triple.append(normalized)
            else:
                tenant.append(normalized)

    payload = {
        "scopeTripleOnRow": sorted(set(triple)),
        "tenantIdOnRow": sorted(set(tenant)),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} ({len(payload['scopeTripleOnRow'])} triple, {len(payload['tenantIdOnRow'])} tenant-id)")


if __name__ == "__main__":
    main()
