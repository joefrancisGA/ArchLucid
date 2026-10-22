#!/usr/bin/env python3
"""One-shot migration: sponsor vocabulary -> sponsor vocabulary (2026-08-13)."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    ".next",
    "bin",
    "obj",
    "dist",
    "packages",
    ".cache",
    ".cursor",
}

SKIP_FILE_SUFFIXES = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".zip",
    ".pdf",
    ".dll",
    ".exe",
    ".pdb",
}

TEXT_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".cs",
    ".json",
    ".md",
    ".mdc",
    ".sql",
    ".py",
    ".ps1",
    ".sh",
    ".yml",
    ".yaml",
    ".xml",
    ".html",
    ".css",
    ".hbs",
    ".txt",
    ".csproj",
    ".slnf",
    ".props",
    ".targets",
    ".editorconfig",
    ".gitignore",
    ".env",
    ".template",
}

# Order matters: longer / more specific replacements first.
REPLACEMENTS: list[tuple[str, str]] = [
    ("sponsor-report", "sponsor-report"),
    ("sponsor-dashboard", "sponsor-dashboard"),
    ("Sponsor report", "Sponsor report"),
    ("sponsor report", "sponsor report"),
    ("Sponsor Report", "Sponsor Report"),
    ("SPONSOR REPORT", "SPONSOR REPORT"),
    ("Sponsor dashboard", "Sponsor dashboard"),
    ("sponsor dashboard", "sponsor dashboard"),
    ("Sponsor Dashboard", "Sponsor Dashboard"),
    ("Sponsor briefing", "Sponsor briefing"),
    ("sponsor briefing", "sponsor briefing"),
    ("Sponsor exports", "Sponsor exports"),
    ("sponsor exports", "sponsor exports"),
    ("Sponsor ROI", "Sponsor ROI"),
    ("sponsor ROI", "sponsor ROI"),
    ("Sponsor attention", "Sponsor attention"),
    ("sponsor attention", "sponsor attention"),
    ("Sponsor confidence", "Sponsor confidence"),
    ("sponsor confidence", "sponsor confidence"),
    ("Sponsor send", "Sponsor send"),
    ("sponsor send", "sponsor send"),
    ("Sponsor-first", "Sponsor-first"),
    ("sponsor-first", "sponsor-first"),
    ("Sponsor", "Sponsor"),
    ("Sponsor", "Sponsor"),
    ("WeeklySponsor", "WeeklySponsor"),
    ("weekly-sponsor", "weekly-sponsor"),
    ("SponsorDigest", "SponsorDigest"),
    ("sponsor-digest", "sponsor-digest"),
    ("Sponsor digest", "Sponsor digest"),
    ("sponsor digest", "sponsor digest"),
    ("/sponsor/", "/sponsor/"),
    ("/sponsor", "/sponsor"),
    ("Sponsor", "Sponsor"),
    ("SPONSOR", "SPONSOR"),
]

DOUBLE_SPONSOR_FIXES = [
    ("Sponsor", "Sponsor"),
    ("sponsor", "sponsor"),
    ("SPONSOR", "SPONSOR"),
    ("Sponsor report", "Sponsor report"),
    ("sponsor report", "sponsor report"),
]

SPONSOR_WORD_RE = re.compile(r"\bexecutive\b", re.IGNORECASE)


def should_skip_dir(path: Path) -> bool:
    return path.name in SKIP_DIR_NAMES


def iter_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES]
        for filename in filenames:
            path = Path(dirpath) / filename
            if path.suffix.lower() in SKIP_FILE_SUFFIXES:
                continue
            if path.suffix.lower() not in TEXT_EXTENSIONS and path.name not in {
                "AGENTS.md",
                "Dockerfile",
                "Makefile",
            }:
                continue
            yield path


def transform_text(content: str) -> str:
    updated = content
    for old, new in REPLACEMENTS:
        updated = updated.replace(old, new)

    def replace_executive_word(match: re.Match[str]) -> str:
        token = match.group(0)
        if token.isupper():
            return "SPONSOR"
        if token[0].isupper():
            return "Sponsor"
        return "sponsor"

    updated = SPONSOR_WORD_RE.sub(replace_executive_word, updated)

    for old, new in DOUBLE_SPONSOR_FIXES:
        updated = updated.replace(old, new)

    return updated


def rename_path_component(name: str) -> str | None:
    renamed = name
    for old, new in REPLACEMENTS:
        renamed = renamed.replace(old, new)

    def replace_executive_word(match: re.Match[str]) -> str:
        token = match.group(0)
        if token.isupper():
            return "SPONSOR"
        if token[0].isupper():
            return "Sponsor"
        return "sponsor"

    renamed = SPONSOR_WORD_RE.sub(replace_executive_word, renamed)
    for old, new in DOUBLE_SPONSOR_FIXES:
        renamed = renamed.replace(old, new)
    return renamed if renamed != name else None


def apply_text_replacements() -> int:
    changed = 0
    for path in iter_files(REPO_ROOT):
        try:
            original = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        updated = transform_text(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed += 1
    return changed


def collect_rename_targets() -> list[tuple[Path, Path]]:
    targets: list[tuple[Path, Path]] = []
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT, topdown=False):
        if should_skip_dir(Path(dirpath)):
            continue
        for filename in filenames:
            path = Path(dirpath) / filename
            new_name = rename_path_component(filename)
            if new_name is not None:
                targets.append((path, path.with_name(new_name)))
        current = Path(dirpath)
        new_dir_name = rename_path_component(current.name)
        if new_dir_name is not None:
            targets.append((current, current.with_name(new_dir_name)))
    return targets


def apply_renames(targets: list[tuple[Path, Path]]) -> int:
    # Deepest paths first to avoid moving parents before children.
    targets.sort(key=lambda pair: len(str(pair[0])), reverse=True)
    renamed = 0
    for source, destination in targets:
        if not source.exists():
            continue
        if destination.exists():
            print(f"SKIP rename (destination exists): {source} -> {destination}", file=sys.stderr)
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        source.rename(destination)
        renamed += 1
    return renamed


def main() -> int:
    rename_only = "--rename-only" in sys.argv
    text_changed = 0

    if not rename_only:
        text_changed = apply_text_replacements()

    rename_targets = collect_rename_targets()
    renamed = apply_renames(rename_targets)
    print(f"Updated {text_changed} files; renamed {renamed} paths.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
