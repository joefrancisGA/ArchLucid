#!/usr/bin/env python3
"""Rewrite standard boolean disclosure HrefFromSearch bodies to operatorBooleanDisclosureHrefFromSearch."""

from __future__ import annotations

import re
import sys
from pathlib import Path

IMPORT_LINE = (
    'import { operatorBooleanDisclosureHrefFromSearch } from '
    '"@/lib/operator/operator-url-href-from-search";\n'
)

BODY_RE = re.compile(
    r"(export function \w+HrefFromSearch\(\s*"
    r"currentSearch: string,\s*"
    r"(\w+): boolean,\s*"
    r"pathname: string,\s*"
    r"\): string \{\s*"
    r")const params = new URLSearchParams\(currentSearch\);\s*"
    r"if \(!\2\) \{\s*"
    r"params\.delete\((\w+)\);\s*"
    r"\} else \{\s*"
    r"params\.set\((\w+), \"1\"\);\s*"
    r"\}\s*"
    r"const nextQuery = params\.toString\(\);\s*"
    r"return nextQuery\.length === 0 \? pathname : `\$\{pathname\}\?\$\{nextQuery\}`;\s*"
    r"\}",
    re.MULTILINE,
)


def transform(content: str) -> str | None:
    match = BODY_RE.search(content)
    if not match:
        return None
    if "operatorBooleanDisclosureHrefFromSearch" in content:
        return None

    param_name = match.group(3)
    bool_arg = match.group(2)
    prefix = match.group(1)
    replacement = (
        f"{prefix}"
        f"return operatorBooleanDisclosureHrefFromSearch(currentSearch, {bool_arg}, pathname, {param_name});\n"
        f"}}"
    )
    new_content = BODY_RE.sub(replacement, content, count=1)
    if IMPORT_LINE.strip() not in new_content:
        # Insert after last import block
        lines = new_content.splitlines(keepends=True)
        insert_at = 0
        for index, line in enumerate(lines):
            if line.startswith("import "):
                insert_at = index + 1
        lines.insert(insert_at, IMPORT_LINE)
        new_content = "".join(lines)
    return new_content


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "archlucid-ui/src/lib")
    changed = 0
    for path in sorted(root.rglob("*.ts")):
        if path.name.endswith(".test.ts"):
            continue
        text = path.read_text(encoding="utf-8")
        if "HrefFromSearch" not in text:
            continue
        updated = transform(text)
        if updated is None or updated == text:
            continue
        path.write_text(updated, encoding="utf-8")
        changed += 1
    print(f"Updated {changed} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
