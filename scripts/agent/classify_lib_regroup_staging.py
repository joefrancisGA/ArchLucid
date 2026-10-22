"""Classify modified files as codemod-only or carrying unrelated uncommitted work.

The `src/lib` regroup wave rewrote import specifiers across the repo, including in files
that already had the owner's uncommitted edits. Staging those wholesale would commit that
unrelated work, so this reports which paths are safe to stage and which are mixed.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import regroup_ui_lib_domains as regroup


def modified_paths() -> list[str]:
    """Unstaged-modified paths only; renames and untracked files are handled separately."""

    completed = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=regroup.REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )

    paths: list[str] = []

    for line in completed.stdout.splitlines():
        code = line[:2]
        path = line[3:].strip().strip('"')

        if "->" in path or "M" not in code:
            continue

        paths.append(path)

    return paths


def main() -> int:
    specifier_only: list[str] = []
    mixed: list[str] = []

    for path in modified_paths():

        if regroup.unstaged_diff_only_changes_module_specifiers(path):
            specifier_only.append(path)
        else:
            mixed.append(path)

    print(f"codemod-only edits (safe to stage): {len(specifier_only)}")
    print(f"files carrying other uncommitted work: {len(mixed)}")
    print()

    for path in mixed:
        print(f"  MIXED {path}")

    Path(regroup.REPO_ROOT / ".local" / "lib-regroup-safe-to-stage.txt").parent.mkdir(
        parents=True, exist_ok=True
    )

    (regroup.REPO_ROOT / ".local" / "lib-regroup-safe-to-stage.txt").write_text(
        "\n".join(specifier_only) + "\n", encoding="utf-8"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
