#!/usr/bin/env python3
"""Add guided WorkspaceModeProvider Vitest mock to buyer-polished specs (WD-01 Working default)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "archlucid-ui" / "src"

WORKSPACE_MOCK = '''
vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();
  const guidedWorkspace = {
    mode: "guided" as const,
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  };

  return {
    ...actual,
    useWorkspaceMode: () => guidedWorkspace,
    useWorkspaceModeOrDefault: () => guidedWorkspace,
  };
});
'''

HOOK_PATTERN = re.compile(
    r'vi\.mock\("@/hooks/useProductionDeskChrome"[\s\S]*?\n\}\);\n',
    re.MULTILINE,
)


def is_buyer_polished(path: Path, _text: str) -> bool:
    return "buyer-polished" in path.name


def patch(text: str) -> str | None:
    if "WorkspaceModeProvider" in text:
        return None
    if "useProductionDeskChrome" not in text:
        return None
    match = HOOK_PATTERN.search(text)
    if match is None:
        return None
    insert_at = match.end()
    return text[:insert_at] + WORKSPACE_MOCK + text[insert_at:]


def main() -> int:
    changed = 0
    for path in sorted(ROOT.rglob("*.test.tsx")):
        text = path.read_text(encoding="utf-8")
        if not is_buyer_polished(path, text):
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
