"""Stage the `src/lib` regroup wave without committing unrelated uncommitted work.

The working tree routinely carries edits this codemod did not make. Staging every modified
file would commit those too, so each modified file is classified instead:

* **pure** — its whole uncommitted diff is module specifiers, so stage it as-is.
* **mixed** — it carries other edits *and* a specifier this wave moved. HEAD's blob is
  rewritten in memory and staged directly, so the commit resolves while the working tree
  keeps the other edits unstaged.
* **unrelated** — left completely alone.

Usage:

    python scripts/agent/stage_lib_regroup_commit.py --folder findings --folder governance
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import regroup_ui_lib_domains as regroup

GIT_ADD_BATCH_SIZE = 100


def modified_tracked_paths() -> list[str]:
    """Repo-relative paths with unstaged content modifications."""

    completed = regroup.run_git(["diff", "--name-only", "--diff-filter=M"])

    return [line.strip() for line in completed.stdout.splitlines() if line.strip()]


def head_blob_bytes(path: str) -> bytes | None:
    """Raw committed content for `path`, or None when it is not in HEAD.

    Read as bytes because some sources are cp1252; decoding them as UTF-8 would corrupt
    every non-ASCII character on the way back into the index.
    """

    completed = subprocess.run(
        ["git", "show", f"HEAD:{path}"],
        cwd=regroup.REPO_ROOT,
        capture_output=True,
    )

    return completed.stdout if completed.returncode == 0 else None


def rewrite_bytes(content: bytes, stem_to_folder: dict[str, str]) -> bytes | None:
    """Apply the domain-folder rewrite to raw file content, or None when nothing changes."""

    for encoding in ("utf-8", regroup.FALLBACK_READ_ENCODING):

        try:
            text = content.decode(encoding)
        except UnicodeDecodeError:
            continue

        alias_pattern, file_path_pattern = regroup.build_reference_patterns(list(stem_to_folder))

        def replace(match) -> str:
            stem = match.group("stem")
            return f"{match.group('prefix')}{stem_to_folder[stem]}/{stem}"

        rewritten = file_path_pattern.sub(replace, alias_pattern.sub(replace, text))

        return None if rewritten == text else rewritten.encode(encoding)

    return None


def stage_blob(path: str, content: bytes) -> None:
    """Write `content` as a blob and point the index entry for `path` at it."""

    hashed = subprocess.run(
        ["git", "hash-object", "-w", "--stdin"],
        cwd=regroup.REPO_ROOT,
        input=content,
        capture_output=True,
        check=True,
    )

    blob_sha = hashed.stdout.decode("ascii").strip()
    regroup.run_git(["update-index", "--cacheinfo", f"100644,{blob_sha},{path}"])


def diff_is_only_module_specifiers(path: str) -> bool:
    """True when the file's unstaged diff changes nothing but quoted module specifiers."""

    return regroup.unstaged_diff_only_changes_module_specifiers(path)


def stage_domain_folders(folders: list[str]) -> None:
    """Stage the moved files and the removal of their old flat paths."""

    target_directory = f"archlucid-ui/src/{regroup.TARGET.name}"

    for folder in folders:
        regroup.run_git(["add", "--all", "--", f"{target_directory}/{folder}"])

    # Old flat paths now only exist in the index; stage their deletion by name so no other
    # deleted path in the tree is picked up.
    deleted = regroup.run_git(["diff", "--name-only", "--diff-filter=D", "--", target_directory])
    paths = [line.strip() for line in deleted.stdout.splitlines() if line.strip()]

    for index in range(0, len(paths), GIT_ADD_BATCH_SIZE):
        regroup.run_git(["add", "--", *paths[index : index + GIT_ADD_BATCH_SIZE]])


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--folder", action="append", required=True, help="domain folder in this wave")
    parser.add_argument(
        "--target",
        default="lib",
        choices=("lib", "components"),
        help="flat directory under archlucid-ui/src that was regrouped (default: lib)",
    )
    parser.add_argument(
        "--no-domain-add",
        action="store_true",
        help="skip staging the domain folders (use when the codemod already staged the renames)",
    )
    arguments = parser.parse_args(argv)

    regroup.TARGET = regroup.RegroupTarget(arguments.target)

    groups = {folder: () for folder in arguments.folder}
    stem_to_folder = regroup.stem_to_folder_from_destinations(groups)

    if not stem_to_folder:
        raise SystemExit("no modules found in the requested folders")

    if not arguments.no_domain_add:
        stage_domain_folders(arguments.folder)

    pure: list[str] = []
    mixed: list[str] = []
    unrelated = 0

    for path in modified_tracked_paths():

        if diff_is_only_module_specifiers(path):
            pure.append(path)
            continue

        committed = head_blob_bytes(path)
        rewritten = None if committed is None else rewrite_bytes(committed, stem_to_folder)

        if rewritten is None:
            unrelated += 1
            continue

        stage_blob(path, rewritten)
        mixed.append(path)

    for index in range(0, len(pure), GIT_ADD_BATCH_SIZE):
        regroup.run_git(["add", "--", *pure[index : index + GIT_ADD_BATCH_SIZE]])

    print(f"staged whole (import-rewrite only): {len(pure)}")
    print(f"staged committed-content-plus-import-fix: {len(mixed)}")
    print(f"left untouched (unrelated edits): {unrelated}")

    for path in mixed:
        print(f"  mixed {path}")

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
