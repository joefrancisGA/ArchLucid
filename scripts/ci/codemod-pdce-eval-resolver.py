#!/usr/bin/env python3
"""Migrate isBuyerPolishedOperatorShellEnv call sites to production-desk eval resolver."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
UI_SRC = REPO / "archlucid-ui" / "src"

DEMO_IMPORT = re.compile(
    r'^import \{([^}]*)\} from "@/lib/demo-ui-env";\n',
    re.MULTILINE,
)
IS_BUYER = "isBuyerPolishedOperatorShellEnv"
HOOK_IMPORT = 'import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";\n'
RESOLVER_IMPORT = 'import { resolveProductionEvalChromeForServer } from "@/lib/production-desk-chrome";\n'


def is_client_component(text: str) -> bool:
    head = text[:400]
    return '"use client"' in head or "'use client'" in head


def migrate_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if IS_BUYER not in text:
        return False

    calls = text.count(f"{IS_BUYER}()")
    if calls == 0:
        new_text = re.sub(
            rf'import \{{[^}}]*{IS_BUYER}[^}}]*\}} from "@/lib/demo-ui-env";\n',
            "",
            text,
        )
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            return True
        return False

    new_text = text
    match = DEMO_IMPORT.search(new_text)
    if match:
        names = [n.strip() for n in match.group(1).split(",")]
        names = [n for n in names if n != IS_BUYER]
        if names:
            repl = f'import {{ {", ".join(names)} }} from "@/lib/demo-ui-env";\n'
        else:
            repl = ""
        new_text = new_text[: match.start()] + repl + new_text[match.end() :]

    client = is_client_component(new_text)
    if client:
        if HOOK_IMPORT.strip() not in new_text:
            # Insert hook import after first import block line.
            insert_at = new_text.find("\n", new_text.find('"use client"'))
            if insert_at < 0:
                insert_at = new_text.find("\n", new_text.find("'use client'"))
            if insert_at < 0:
                insert_at = 0
            else:
                insert_at += 1
            new_text = new_text[:insert_at] + "\n" + HOOK_IMPORT + new_text[insert_at:]
        new_text = new_text.replace(f"{IS_BUYER}()", "useProductionEvalChrome()")
    else:
        if RESOLVER_IMPORT.strip() not in new_text:
            first_import = re.search(r"^import ", new_text, re.MULTILINE)
            pos = first_import.start() if first_import else 0
            new_text = new_text[:pos] + RESOLVER_IMPORT + new_text[pos:]
        new_text = new_text.replace(
            f"{IS_BUYER}()",
            "resolveProductionEvalChromeForServer()",
        )

    if new_text == text:
        return False

    path.write_text(new_text, encoding="utf-8")
    return True


def main() -> int:
    violations = Path("/tmp/pdce-violations.txt")
    paths = (
        [line.strip() for line in violations.read_text(encoding="utf-8").splitlines() if line.strip()]
        if violations.is_file()
        else []
    )
    if not paths:
        print("No /tmp/pdce-violations.txt; scanning discover via test is required", file=sys.stderr)
        return 1

    changed = 0
    for rel in paths:
        path = UI_SRC / rel
        if not path.is_file():
            print(f"missing: {rel}", file=sys.stderr)
            continue
        if migrate_file(path):
            changed += 1
            print(f"migrated: {rel}")
    print(f"Total changed: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
