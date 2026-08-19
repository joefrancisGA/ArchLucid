"""Shared git diff path helpers for diff-scoped CI guards."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def repo_root() -> Path:
    env_root = os.environ.get("ARCHLUCID_GIT_REPO_ROOT", "").strip()

    if env_root:
        return Path(env_root).resolve()

    return Path(__file__).resolve().parents[2]


def normalize_git_path(path: str) -> str:
    return path.strip().replace("\\", "/")


def is_empty_github_push_before(before_sha: str) -> bool:
    cleaned = before_sha.strip().lower()

    return cleaned == "" or set(cleaned) <= {"0"}


def should_skip_push_range(diff_range: str) -> bool:
    if "..." not in diff_range:
        return False

    before = diff_range.split("...", 1)[0].strip()

    return is_empty_github_push_before(before)


def resolve_diff_range(args: argparse.Namespace | None = None) -> str | None:
    literal = (os.environ.get("ARCHLUCID_GIT_DIFF_RANGE") or "").strip()

    if literal:
        if should_skip_push_range(literal):
            return None

        return literal

    if args is not None and getattr(args, "diff_range", None):
        return str(args.diff_range).strip()

    base = (os.environ.get("ARCHLUCID_DIFF_BASE") or "").strip()
    head = (os.environ.get("ARCHLUCID_DIFF_HEAD") or "").strip()

    if base and head:
        if is_empty_github_push_before(base):
            return None

        return f"{base}...{head}"

    return None


def git_diff_name_only(repo: Path, diff_range: str) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", diff_range],
        cwd=repo,
        check=False,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"git diff failed for {diff_range}")

    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def add_diff_range_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--diff-range",
        help="Passed to git diff --name-only, e.g. origin/main...HEAD",
    )


def resolve_changed_paths_or_skip(
    argv: list[str] | None,
    *,
    skip_message: str,
) -> tuple[int, list[str]] | None:
    """Returns None when the guard should exit 0 without scanning."""
    parser = argparse.ArgumentParser(add_help=False)
    add_diff_range_arg(parser)
    args, _ = parser.parse_known_args(argv)

    repo = repo_root()
    diff_range = resolve_diff_range(args)
    ci_range_hint = (os.environ.get("ARCHLUCID_GIT_DIFF_RANGE") or "").strip()

    if diff_range is None:
        if ci_range_hint and should_skip_push_range(ci_range_hint):
            print(f"Skipping guard: GitHub push with no meaningful before SHA ({skip_message}).")
            return None

        print(f"Skipping guard: no diff range configured ({skip_message}).")
        return None

    try:
        paths = git_diff_name_only(repo, diff_range)
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        return (1, [])

    return (None, paths)  # type: ignore[return-value]
