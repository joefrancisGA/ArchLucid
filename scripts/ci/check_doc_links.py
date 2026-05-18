#!/usr/bin/env python3
"""
Validate relative markdown links in docs/, archlucid-ui/docs/, and root README.md.
With one or more path arguments (repo-relative), scan only those .md files or directories.
External https?://, mailto:, tel:, and fragment-only (#anchor) targets are skipped.
Exit 1 if any target file is missing.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

# Matches markdown inline links.  The URL capture group allows one level of
# balanced inner parentheses so that Next.js route-group segments such as
# `(operator)` or `(marketing)` in a path do not prematurely terminate the
# match.  Pattern breakdown:
#   [^()]*          — characters that are not parens (before/between/after groups)
#   (?:\([^()]*\))* — zero or more balanced (inner) paren pairs, non-capturing
#   [^()]*          — trailing characters after the last inner pair
LINK_RE = re.compile(r"(?<!\!)\[[^\]]*\]\(([^()]*(?:\([^()]*\))*[^()]*)\)")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def should_skip_target(raw: str) -> bool:
    t = raw.strip()

    if not t or t.startswith("#"):
        return True

    if t.startswith("http://") or t.startswith("https://"):
        return True

    if t.startswith("mailto:") or t.startswith("tel:"):
        return True

    if "{" in t or "*" in t:
        return True

    if t.startswith("vscode:") or t.startswith("javascript:"):
        return True

    return False


def resolve_target(md_file: Path, target: str) -> Path | None:
    """Return filesystem path for link target, or None if not file-relative."""
    t = target.strip()
    pos = t.find("#")

    if pos >= 0:
        t = t[:pos].strip()

    if not t:
        return None

    if should_skip_target(t):
        return None

    # Decode percent-encoding (e.g. %28operator%29 → (operator)) so that
    # Next.js route-group directory names resolve correctly on disk.
    t = unquote(t)
    base = md_file.parent
    resolved = (base / t).resolve()

    try:
        resolved.relative_to(repo_root())
    except ValueError:
        return None

    return resolved


def collect_markdown_files(root: Path, paths: list[str] | None) -> list[Path]:
    """All repo markdown under docs/ + UI docs + README, or only given paths."""
    if paths:
        files: list[Path] = []

        for arg in paths:
            candidate = Path(arg)

            if not candidate.is_absolute():
                candidate = root / candidate

            candidate = candidate.resolve()

            if not candidate.is_file() and not candidate.is_dir():
                continue

            if candidate.is_file() and candidate.suffix.lower() == ".md":
                files.append(candidate)

            if candidate.is_dir():
                files.extend(sorted(candidate.rglob("*.md")))

        deduped: dict[str, Path] = {}

        for md in files:
            try:
                key = md.resolve().relative_to(root).as_posix()
            except ValueError:
                continue

            deduped[key] = md.resolve()

        return list(deduped.values())

    scan_dirs = [
        root / "docs",
        root / "archlucid-ui" / "docs",
    ]
    all_files: list[Path] = [root / "README.md"]

    for directory in scan_dirs:
        if directory.is_dir():
            all_files.extend(sorted(directory.rglob("*.md")))

    return all_files


def main() -> int:
    root = repo_root()
    argv_paths = sys.argv[1:] if len(sys.argv) > 1 else None
    files = collect_markdown_files(root, argv_paths)

    broken: list[str] = []

    for md in files:
        if not md.is_file():
            continue

        try:
            rel_md = md.relative_to(root).as_posix()
        except ValueError:
            continue

        if rel_md.startswith("docs/archive/"):
            continue

        text = md.read_text(encoding="utf-8", errors="replace")

        for m in LINK_RE.finditer(text):
            raw = m.group(1).strip().strip('"').strip("'")
            path_only = resolve_target(md, raw)

            if path_only is None:
                continue

            if path_only.is_file() or path_only.is_dir():
                continue

            if path_only.suffix.lower() != ".md":
                md_candidate = path_only.with_suffix(".md")

                if md_candidate.is_file():
                    continue

            idx = md.relative_to(root).as_posix()
            broken.append(f"{idx}:{raw} -> missing path {path_only.relative_to(root).as_posix()}")

    if broken:
        print("Broken relative markdown links:", file=sys.stderr)

        for line in broken[:200]:
            print(line, file=sys.stderr)

        if len(broken) > 200:
            print(f"... and {len(broken) - 200} more", file=sys.stderr)

        return 1

    print(f"check_doc_links: OK ({len(files)} markdown files scanned)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
