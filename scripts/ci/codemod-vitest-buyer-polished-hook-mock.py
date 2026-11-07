#!/usr/bin/env python3
"""Add useProductionEvalChrome Vitest mock to buyer-polished specs that still only stub demo-ui-env."""

from __future__ import annotations

import re
import sys
from pathlib import Path

HOOK_MOCK = '''
vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => false,
  useProductionEvalChrome: () => true,
}));
'''

ROOT = Path(__file__).resolve().parents[2] / "archlucid-ui" / "src"


def should_touch(path: Path, text: str) -> bool:
    if "useProductionDeskChrome" in text:
        return False
    if "isBuyerPolishedOperatorShellEnv" not in text and "buyer-polished" not in path.name:
        return False
    return True


def patch(text: str) -> str | None:
    if not should_touch(Path(), text):
        return None
    # Insert after first demo-ui-env vi.mock block closes.
    pattern = re.compile(
        r'(vi\.mock\("@/lib/demo-ui-env"[\s\S]*?\n\}\);\n)',
        re.MULTILINE,
    )
    match = pattern.search(text)
    if match is None:
        if "buyer-polished" in text or "buyer-polished" in "":
            return None
        return None
    insert_at = match.end()
    return text[:insert_at] + HOOK_MOCK + text[insert_at:]


def main() -> int:
    changed = 0
    for path in ROOT.rglob("*.test.tsx"):
        text = path.read_text(encoding="utf-8")
        if not should_touch(path, text):
            continue
        updated = patch(text)
        if updated is None:
            continue
        path.write_text(updated, encoding="utf-8")
        changed += 1
        print(path.relative_to(ROOT.parent))
    print(f"Patched {changed} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
