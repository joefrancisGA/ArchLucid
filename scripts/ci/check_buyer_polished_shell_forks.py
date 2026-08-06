#!/usr/bin/env python3
"""Fail when isBuyerPolishedOperatorShellEnv appears in production UI without manifest entry."""

from __future__ import annotations

import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
UI_SRC = REPO_ROOT / "archlucid-ui" / "src"
MANIFEST = REPO_ROOT / "docs" / "engineering" / "buyer-polished-shell-forks.manifest.txt"
INVENTORY_DOC = REPO_ROOT / "docs" / "engineering" / "BUYER_POLISHED_SHELL_FORKS.md"

CALL_PATTERN = re.compile(r"\bisBuyerPolishedOperatorShellEnv\b")

EXCLUDED_SUFFIXES = (
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
)

EXCLUDED_RELATIVE_PATHS = {
    "archlucid-ui/src/lib/demo-ui-env.ts",
    "archlucid-ui/src/testing/buyer-polished-shell-vitest-override.ts",
}


def is_production_source(path: Path) -> bool:
    if not path.is_file():
        return False

    if path.suffix not in {".ts", ".tsx"}:
        return False

    name = path.name

    if name.endswith(EXCLUDED_SUFFIXES):
        return False

    if "buyer-polished.test." in name:
        return False

    return True


def relative_repo_path(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def discover_fork_paths() -> list[str]:
    discovered: list[str] = []

    for path in UI_SRC.rglob("*"):
        if not is_production_source(path):
            continue

        text = path.read_text(encoding="utf-8")

        if not CALL_PATTERN.search(text):
            continue

        rel = relative_repo_path(path)

        if rel in EXCLUDED_RELATIVE_PATHS:
            continue

        discovered.append(rel)

    return sorted(discovered)


def load_manifest() -> list[str]:
    if not MANIFEST.is_file():
        return []

    lines = MANIFEST.read_text(encoding="utf-8-sig").splitlines()
    entries: list[str] = []

    for line in lines:
        stripped = line.strip().removeprefix("\ufeff")

        if not stripped or stripped.startswith("#"):
            continue

        entries.append(stripped)

    return entries


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "--emit-manifest":
        discovered = discover_fork_paths()
        MANIFEST.write_text("\n".join(discovered) + ("\n" if discovered else ""), encoding="utf-8")
        print(f"Wrote {len(discovered)} paths to {MANIFEST.relative_to(REPO_ROOT)}")
        return 0

    if not INVENTORY_DOC.is_file():
        print(f"Missing inventory doc: {INVENTORY_DOC}", file=sys.stderr)
        return 1

    discovered = discover_fork_paths()
    manifest = load_manifest()

    missing_from_manifest = sorted(set(discovered) - set(manifest))
    stale_manifest = sorted(set(manifest) - set(discovered))

    if missing_from_manifest:
        print("Production files call isBuyerPolishedOperatorShellEnv but are not in manifest:", file=sys.stderr)

        for path in missing_from_manifest:
            print(f"  + {path}", file=sys.stderr)

    if stale_manifest:
        print("Manifest entries no longer contain isBuyerPolishedOperatorShellEnv:", file=sys.stderr)

        for path in stale_manifest:
            print(f"  - {path}", file=sys.stderr)

    if missing_from_manifest or stale_manifest:
        print(f"Update {MANIFEST.relative_to(REPO_ROOT)}", file=sys.stderr)
        return 1

    print(f"OK: {len(manifest)} forks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
