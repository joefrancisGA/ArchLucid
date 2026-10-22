#!/usr/bin/env python3
"""Fail when common UTF-8 mojibake literals appear in user-facing source trees."""
from __future__ import annotations

import fnmatch
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ALLOWLIST_PATH = Path(__file__).resolve().parent / "utf8_mojibake_guard_allowlist.txt"

SCAN_ROOTS = (
    REPO_ROOT / "ArchLucid.Application",
    REPO_ROOT / "ArchLucid.Api",
    REPO_ROOT / "ArchLucid.Core",
    REPO_ROOT / "ArchLucid.ArtifactSynthesis",
    REPO_ROOT / "ArchLucid.Host.Composition",
    REPO_ROOT / "archlucid-ui" / "src",
)

EXTENSIONS = {".cs", ".ts", ".tsx", ".js", ".jsx"}

# Sequences produced when UTF-8 punctuation was mis-decoded (Latin-1 / CP1252).
FORBIDDEN_RE = re.compile(
    r"Â·|Â§|â€[\x9d\x9c\x98\x99\x9a]|â€™|â€œ|â€˜|â€¦|â†|Ã[\x80-\xbf]|Ã¢|ï¿½"
)

LINE_ALLOW_TAG = "mojibake-guard: allow"


def load_allowlist_globs() -> list[str]:
    if not ALLOWLIST_PATH.is_file():
        return []

    globs: list[str] = []

    for raw in ALLOWLIST_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()

        if line:
            globs.append(line)

    return globs


def path_is_allowlisted(rel_posix: str, allow_globs: list[str]) -> bool:
    return any(fnmatch.fnmatch(rel_posix, pattern) for pattern in allow_globs)


def scan_file(path: Path, allow_globs: list[str]) -> list[str]:
    rel = path.relative_to(REPO_ROOT).as_posix()

    if path_is_allowlisted(rel, allow_globs):
        return []

    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as ex:
        return [f"{rel}: unreadable ({ex})"]

    violations: list[str] = []

    for line_no, line in enumerate(text.splitlines(), start=1):
        if LINE_ALLOW_TAG in line:
            continue

        if FORBIDDEN_RE.search(line):
            snippet = line.strip()

            if len(snippet) > 140:
                snippet = snippet[:137] + "..."

            violations.append(f"{rel}:{line_no}: {snippet}")

    return violations


def main() -> int:
    allow_globs = load_allowlist_globs()
    all_violations: list[str] = []

    for root in SCAN_ROOTS:
        if not root.is_dir():
            continue

        for path in root.rglob("*"):
            if not path.is_file() or path.suffix not in EXTENSIONS:
                continue

            if "node_modules" in path.parts:
                continue

            all_violations.extend(scan_file(path, allow_globs))

    if all_violations:
        print("UTF-8 mojibake literals found in user-facing source (fix or allowlist with care):", file=sys.stderr)

        for item in sorted(all_violations):
            print(item, file=sys.stderr)

        print(
            f"\n{len(all_violations)} violation(s). Allowlist: {ALLOWLIST_PATH.relative_to(REPO_ROOT)}",
            file=sys.stderr,
        )

        return 1

    print("assert_no_utf8_mojibake_in_user_source: ok")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
