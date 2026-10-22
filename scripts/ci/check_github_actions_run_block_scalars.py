#!/usr/bin/env python3
"""Reject GitHub Actions `run:` steps that are folded YAML scalars.

A mapping like::

    run:
      npx playwright install --with-deps chromium
      npx playwright test

is a plain/folded scalar. GitHub Actions joins the lines with spaces, so
Playwright receives extra install targets (``npx``, ``playwright``, ``test``)
instead of running two commands. Require a block scalar (``|`` / ``>``) for
any multiline ``run:`` value.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# `run:` on its own line, then an indented value that is not a block scalar
# (`|`, `>`, with optional chomp/indent indicators) or a flow collection.
_FOLDED_RUN = re.compile(
    r"(?m)^(?P<indent>[ \t]+)run:[ \t]*\r?\n"
    r"(?:(?P=indent)[ \t]+#[^\n]*\r?\n)*"
    r"(?P=indent)[ \t]+(?![\|>\[{])"
)

_WORKFLOWS_REL = ".github/workflows"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def find_folded_run_steps(text: str) -> list[int]:
    """Return 1-based line numbers of folded multiline `run:` keys."""
    hits: list[int] = []

    for match in _FOLDED_RUN.finditer(text):
        hits.append(text.count("\n", 0, match.start()) + 1)

    return hits


def scan_workflow_dir(workflows_dir: Path) -> list[str]:
    errors: list[str] = []

    if not workflows_dir.is_dir():
        return [f"missing workflow directory: {workflows_dir.as_posix()}"]

    paths = sorted(
        [*workflows_dir.glob("*.yml"), *workflows_dir.glob("*.yaml")],
        key=lambda path: path.name.lower(),
    )

    if len(paths) == 0:
        return [f"{workflows_dir.as_posix()}: no .yml/.yaml workflow files"]

    for path in paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        rel = path.as_posix()

        for line_number in find_folded_run_steps(text):
            errors.append(
                f"{rel}:{line_number}: multiline `run:` must use a block scalar "
                "(`run: |` or `run: >`). Folded YAML joins lines with spaces, so "
                "`npx playwright install …` receives later lines as install targets.",
            )

    return errors


def scan(root: Path) -> list[str]:
    return scan_workflow_dir(root / _WORKFLOWS_REL)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    errors = scan(repo_root())

    if errors:
        print("check_github_actions_run_block_scalars: FAIL", file=sys.stderr)

        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_github_actions_run_block_scalars: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
