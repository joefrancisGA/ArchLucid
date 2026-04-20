"""CI guard: forbid re-introduction of legacy ``ArchiForge.*`` workspace directories.

The product was renamed from **ArchiForge** to **ArchLucid** (initiative closed
2026-04-19; see ``.cursor/rules/ArchLucid-Rename.mdc`` and
``docs/ARCHLUCID_RENAME_CHECKLIST.md``). The empty legacy project folders at
the workspace root (build-artifact-only, never tracked by git) were physically
deleted in Phase 8. This script keeps them gone.

The script walks the repo root, skipping standard build/test/coverage trees and
``docs/archive/`` (which is allowed to mention legacy names historically), and
exits non-zero if it finds any directory whose name starts with the literal
prefix ``ArchiForge.`` (case-sensitive — the rename is case-sensitive too).

Usage:
    python scripts/ci/check_no_legacy_archiforge_dirs.py
    python scripts/ci/check_no_legacy_archiforge_dirs.py --repo-root /path/to/repo

Exit codes:
    0 — no legacy directories found
    1 — at least one legacy directory found (path printed; remediation pointer printed)
    2 — invocation error (bad repo root)
"""

from __future__ import annotations

import argparse
import pathlib
import sys

LEGACY_PREFIX: str = "ArchiForge."

# Skip directories that are either build artifacts, vendor trees, or
# explicitly archived. ``docs/archive/`` may mention legacy names in
# historical narratives and must not be flagged.
SKIP_DIRS: frozenset[str] = frozenset({
    ".git",
    "node_modules",
    "obj",
    "bin",
    "_cov_merge",
    "coverage-raw",
    "TestResults",
    ".vs",
    "artifacts",
    ".tools",
})

# Future allow-list for legitimate carve-outs. New entries require an inline
# comment naming the ADR or product decision that authorizes the carve-out.
ALLOW_LIST: frozenset[str] = frozenset()

# Sub-paths under which legacy names are allowed (historical archive only).
ARCHIVE_SUBPATHS: tuple[str, ...] = ("docs/archive",)


def find_legacy_dirs(
    repo_root: pathlib.Path,
    allow_list: frozenset[str],
    skip_dirs: frozenset[str],
    archive_subpaths: tuple[str, ...] = ARCHIVE_SUBPATHS,
) -> list[pathlib.Path]:
    """Return every directory under ``repo_root`` whose name starts with the
    legacy prefix and is not allow-listed, archived, or below a skip dir.

    Pure function — accepts every input it depends on so unit tests can drive
    it against a temp tree without touching the real repository.

    >>> find_legacy_dirs(pathlib.Path('.'), frozenset(), frozenset()) == []
    True
    """

    if repo_root is None: raise ValueError("repo_root is required")
    if not repo_root.exists(): raise FileNotFoundError(repo_root)
    if not repo_root.is_dir(): raise NotADirectoryError(repo_root)

    found: list[pathlib.Path] = []

    for current, dir_names, _ in _walk(repo_root, skip_dirs):
        rel_current: str = current.relative_to(repo_root).as_posix()

        if any(rel_current == sub or rel_current.startswith(sub + "/") for sub in archive_subpaths):
            dir_names.clear()
            continue

        for name in list(dir_names):
            if not name.startswith(LEGACY_PREFIX): continue
            if name in allow_list: continue
            found.append(current / name)

    return sorted(found)


def _walk(root: pathlib.Path, skip_dirs: frozenset[str]):
    """``os.walk``-style traversal that respects ``skip_dirs`` in-place.

    Wrapped so the public function can stay focused on the matching logic.
    """

    import os

    for current_str, sub_dirs, file_names in os.walk(root):
        sub_dirs[:] = [d for d in sub_dirs if d not in skip_dirs]
        yield pathlib.Path(current_str), sub_dirs, file_names


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--repo-root",
        type=pathlib.Path,
        default=pathlib.Path.cwd(),
        help="Repository root to scan (defaults to current working directory).",
    )

    args = parser.parse_args(argv)

    if not args.repo_root.exists():
        print(f"::error::repo root does not exist: {args.repo_root}", file=sys.stderr)
        return 2

    found: list[pathlib.Path] = find_legacy_dirs(args.repo_root, ALLOW_LIST, SKIP_DIRS)

    if not found:
        print(f"OK: no legacy ArchiForge.* directories found under {args.repo_root}.")
        return 0

    print(f"::error::Found {len(found)} legacy ArchiForge.* director(y|ies) — these were removed in workspace cleanup Phase 8 and must not be reintroduced:")
    for path in found:
        print(f"  - {path.relative_to(args.repo_root).as_posix()}")
    print(
        "\nRemediation: delete the directory in your working tree, or document an explicit "
        "carve-out in scripts/ci/check_no_legacy_archiforge_dirs.py ALLOW_LIST with an "
        "inline comment citing the ADR or product decision that authorizes it.\n"
        "Background: docs/ARCHLUCID_RENAME_CHECKLIST.md Phase 8, .cursor/rules/ArchLucid-Rename.mdc.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
