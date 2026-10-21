#!/usr/bin/env python3
"""Insert applyOperatorUrlSelectionSwitch after URLSearchParams(currentSearch) in HrefFromSearch exporters."""

from __future__ import annotations

import sys
from pathlib import Path

IMPORT = (
    'import { applyOperatorUrlSelectionSwitch } from "@/lib/operator/operator-url-selection-switch";\n'
)
PARAMS_LINE = "  const params = new URLSearchParams(currentSearch);\n"
MARKERS = (
    "applyOperatorUrlSelectionSwitch",
    "buildOperatorHrefFromSearch",
    "operatorBooleanDisclosureHrefFromSearch",
)


def switch_for(path: Path) -> str:
    text = str(path).replace("\\", "/")
    if "governance-findings" in text or "governance-assigned-to-me" in text:
        return '{ kind: "governance-findings-queue-navigation" }'
    if "infra-evidence" in text or "resource-hub" in text or "resources-explorer" in text:
        return '{ kind: "infra-resource-hub-run-scope" }'
    return '{ kind: "disclosure-only" }'


def transform(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if any(marker in text for marker in MARKERS):
        return False
    if "HrefFromSearch" not in text or "export function" not in text:
        return False
    if PARAMS_LINE not in text:
        return False

    switch = switch_for(path)
    insert = f"{PARAMS_LINE}  applyOperatorUrlSelectionSwitch(params, {switch});\n"
    new_text = text.replace(PARAMS_LINE, insert, 1)
    if new_text == text:
        return False

    if IMPORT.strip() not in new_text:
        lines = new_text.splitlines(keepends=True)
        insert_at = 0
        for index, line in enumerate(lines):
            if line.startswith("import "):
                insert_at = index + 1
        lines.insert(insert_at, IMPORT)
        new_text = "".join(lines)

    path.write_text(new_text, encoding="utf-8")
    return True


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "archlucid-ui/src")
    changed = 0
    for path in sorted(root.rglob("*.ts")):
        if path.name.endswith(".test.ts"):
            continue
        if transform(path):
            changed += 1
    print(f"Updated {changed} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
