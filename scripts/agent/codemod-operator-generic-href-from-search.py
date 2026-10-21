#!/usr/bin/env python3
"""Wrap standard HrefFromSearch bodies with buildOperatorHrefFromSearch."""

from __future__ import annotations

import re
import sys
from pathlib import Path

IMPORT_LINE = (
    'import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";\n'
)

FUNC_BODY_RE = re.compile(
    r"(export function \w+HrefFromSearch\([^{]+\): string \{\n)"
    r"  const params = new URLSearchParams\(currentSearch\);\n\n?"
    r"((?:.*\n)+?)"
    r"  const (?:nextQuery|query) = params\.toString\(\);\n\n?"
    r"  return (?:nextQuery|query)\.length === 0 \? (\w+) : `\$\{(\w+)\}\?\$\{(?:nextQuery|query)\}`;\n"
    r"\}",
    re.MULTILINE,
)


def selection_switch_for(path: Path) -> str:
    text = str(path).replace("\\", "/")
    if "governance-findings" in text or "governance/governance-assigned-to-me" in text:
        return '{ kind: "governance-findings-queue-navigation" }'
    if "governance-findings-register-filter" in text:
        return '{ kind: "governance-findings-register-filter" }'
    if "policy-pack-selection" in text:
        return '{ kind: "policy-pack-selection" }'
    if "policy-pack-catalog-entry" in text:
        return '{ kind: "policy-pack-catalog-entry" }'
    if "policy-pack-authoring-input-mode" in text:
        return '{ kind: "policy-pack-authoring-input-mode" }'
    if "policy-pack-generator-template" in text:
        return '{ kind: "policy-pack-generator-template" }'
    if "policy-packs-tab" in text:
        return '{ kind: "policy-packs-tab", tab: "my-packs" }'  # fallback; manual fix tab-specific
    if "infra-evidence-hub" in text or "infra-resource-hub" in text or "resource-hub" in text:
        return '{ kind: "infra-resource-hub-run-scope" }'
    return '{ kind: "disclosure-only" }'


def indent_mutate(body: str) -> str:
    lines = body.splitlines()
    indented = []
    for line in lines:
        if line.strip() == "":
            indented.append("")
        else:
            indented.append("  " + line)
    return "\n".join(indented).rstrip() + "\n"


def transform_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "buildOperatorHrefFromSearch" in text or "operatorBooleanDisclosureHrefFromSearch" in text:
        return False
    if "applyOperatorUrlSelectionSwitch" in text:
        return False
    if "export function" not in text or "HrefFromSearch" not in text:
        return False

    switch = selection_switch_for(path)

    def replacer(match: re.Match[str]) -> str:
        header = match.group(1)
        body = match.group(2)
        path_var = match.group(3)
        mutate = indent_mutate(body)
        return (
            f"{header}"
            f"  return buildOperatorHrefFromSearch(currentSearch, {path_var}, {{\n"
            f"    selectionSwitch: {switch},\n"
            f"    mutate: (params) => {{\n"
            f"{mutate}"
            f"    }},\n"
            f"  }});\n"
            f"}}"
        )

    new_text, count = FUNC_BODY_RE.subn(replacer, text)
    if count == 0:
        return False

    if IMPORT_LINE.strip() not in new_text:
        lines = new_text.splitlines(keepends=True)
        insert_at = 0
        for index, line in enumerate(lines):
            if line.startswith("import "):
                insert_at = index + 1
        lines.insert(insert_at, IMPORT_LINE)
        new_text = "".join(lines)

    path.write_text(new_text, encoding="utf-8")
    return True


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "archlucid-ui/src")
    changed = 0
    for path in sorted(root.rglob("*.ts")):
        if path.name.endswith(".test.ts"):
            continue
        if transform_file(path):
            changed += 1
    print(f"Updated {changed} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
