#!/usr/bin/env python3
"""One-shot migration: executive vocabulary -> sponsor vocabulary (2026-08-13)."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = Path(__file__).resolve()

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
    ("executive-report", "sponsor-report"),
    ("executive-dashboard", "sponsor-dashboard"),
    ("Executive report", "Sponsor report"),
    ("executive report", "sponsor report"),
    ("Executive Report", "Sponsor Report"),
    ("EXECUTIVE REPORT", "SPONSOR REPORT"),
    ("Executive dashboard", "Sponsor dashboard"),
    ("executive dashboard", "sponsor dashboard"),
    ("Executive Dashboard", "Sponsor Dashboard"),
    ("Executive briefing", "Sponsor briefing"),
    ("executive briefing", "sponsor briefing"),
    ("Executive exports", "Sponsor exports"),
    ("executive exports", "sponsor exports"),
    ("Executive ROI", "Sponsor ROI"),
    ("executive ROI", "sponsor ROI"),
    ("Executive attention", "Sponsor attention"),
    ("executive attention", "sponsor attention"),
    ("Executive confidence", "Sponsor confidence"),
    ("executive confidence", "sponsor confidence"),
    ("Executive send", "Sponsor send"),
    ("executive send", "sponsor send"),
    ("Executive-first", "Sponsor-first"),
    ("executive-first", "sponsor-first"),
    ("WeeklyExecutive", "WeeklySponsor"),
    ("weekly-executive", "weekly-sponsor"),
    ("ExecutiveDigest", "SponsorDigest"),
    ("executive-digest", "sponsor-digest"),
    ("Executive digest", "Sponsor digest"),
    ("executive digest", "sponsor digest"),
    ("/executive/", "/sponsor/"),
    ("/executive", "/sponsor"),
    ("Executive", "Sponsor"),
    ("EXECUTIVE", "SPONSOR"),
]

DOUBLE_SPONSOR_FIXES = [
    ("SponsorSponsor", "Sponsor"),
    ("sponsorsponsor", "sponsor"),
    ("SPONSORSPONSOR", "SPONSOR"),
    ("Sponsor report report", "Sponsor report"),
    ("sponsor report report", "sponsor report"),
]

EXECUTIVE_WORD_RE = re.compile(r"\bexecutive\b", re.IGNORECASE)


def should_skip_dir(path: Path) -> bool:
    return path.name in SKIP_DIR_NAMES


def iter_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES]
        for filename in filenames:
            path = Path(dirpath) / filename
            if path.resolve() == SCRIPT_PATH:
                continue
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

    updated = EXECUTIVE_WORD_RE.sub(replace_executive_word, updated)

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

    renamed = EXECUTIVE_WORD_RE.sub(replace_executive_word, renamed)
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
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT, topdown=True):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES]
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


def apply_renames(targets: list[tuple[Path, Path]]) -> tuple[int, int]:
    # Deepest paths first to avoid moving parents before children.
    targets.sort(key=lambda pair: len(str(pair[0])), reverse=True)
    renamed = 0
    skipped = 0
    for source, destination in targets:
        if not source.exists():
            continue
        if destination.exists():
            print(f"SKIP rename (destination exists): {source} -> {destination}", file=sys.stderr)
            skipped += 1
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        source.rename(destination)
        renamed += 1
    return renamed, skipped


def main() -> int:
    rename_only = "--rename-only" in sys.argv
    text_changed = 0

    if not rename_only:
        text_changed = apply_text_replacements()

    rename_targets = collect_rename_targets()
    renamed, skipped = apply_renames(rename_targets)
    print(f"Updated {text_changed} files; renamed {renamed} paths; skipped {skipped} renames.")
    return 1 if skipped > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
