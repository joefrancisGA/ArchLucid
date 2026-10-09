#!/usr/bin/env python3
"""Files that call useWorkspaceMode must be Client Components.

Next.js treats a module without ``"use client"`` as a Server Component. Calling
``useWorkspaceMode`` there fails at runtime with:

    Attempted to call useWorkspaceMode() from the server

Nightly live-E2E webServer logs showed that crash on operator routes.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_HOOK_VALUE_IMPORT = re.compile(
    r"(?m)^import\s+(?!type\b)\{[^}]*\buseWorkspaceMode(?:OrDefault)?\b[^}]*\}\s+"
    r"from\s+[\"']@/components/WorkspaceModeProvider[\"']"
)
_HOOK_CALL = re.compile(r"\buseWorkspaceMode(?:OrDefault)?\s*\(")
_USE_CLIENT = re.compile(r"""^["']use client["'];?\s*$""")

_SCAN_SUFFIXES = {".ts", ".tsx"}
_SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "coverage",
}
_SKIP_FILE_NAMES = {
    "WorkspaceModeProvider.tsx",
    "vitest.setup.ts",
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _first_nonempty_line(text: str) -> str:
    for line in text.lstrip("\ufeff").splitlines():
        stripped = line.strip()

        if stripped:
            return stripped

    return ""


def file_has_use_client_directive(text: str) -> bool:
    return _USE_CLIENT.match(_first_nonempty_line(text)) is not None


def file_uses_workspace_mode_hook(text: str) -> bool:
    if _HOOK_VALUE_IMPORT.search(text) is not None:
        return True

    return _HOOK_CALL.search(text) is not None


def should_scan(path: Path) -> bool:
    if not path.is_file():
        return False

    if path.suffix.lower() not in _SCAN_SUFFIXES:
        return False

    if path.name in _SKIP_FILE_NAMES:
        return False

    if path.name.endswith(".test.ts") or path.name.endswith(".test.tsx"):
        return False

    if path.name.endswith(".spec.ts") or path.name.endswith(".spec.tsx"):
        return False

    return not any(part in _SKIP_DIR_NAMES for part in path.parts)


def find_missing_client_boundaries(root: Path) -> list[str]:
    hits: list[str] = []

    for path in sorted(root.rglob("*")):
        if not should_scan(path):
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        if not file_uses_workspace_mode_hook(text):
            continue

        if file_has_use_client_directive(text):
            continue

        rel = path.as_posix()
        hits.append(
            f"{rel}: files that import or call useWorkspaceMode must start with "
            '"use client" so Next does not invoke the hook on the server.',
        )

    return hits


def scan(root: Path) -> list[str]:
    ui_src = root / "archlucid-ui" / "src"

    if not ui_src.is_dir():
        return [f"missing UI source directory: {ui_src.as_posix()}"]

    return find_missing_client_boundaries(ui_src)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    errors = scan(repo_root())

    if errors:
        print("check_workspace_mode_client_boundary: FAIL", file=sys.stderr)

        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_workspace_mode_client_boundary: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
