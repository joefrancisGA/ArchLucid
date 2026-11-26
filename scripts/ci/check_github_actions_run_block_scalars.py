#!/usr/bin/env python3
"""Reject GitHub Actions `run:` steps that are folded YAML scalars.

A mapping like::

    run:
      npx playwright install --with-deps chromium
      npx playwright test

is a plain/folded scalar. GitHub Actions joins the lines with spaces, so
Playwright receives extra install targets (``npx``, ``playwright``, ``test``)
instead of running two commands. Require a block scalar (``|`` / ``>``) for
any multiline command value. ``defaults.run`` is a YAML mapping, not a
command step.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Match the key on its own line, including when it opens a sequence item.
_RUN_KEY = re.compile(
    r'''(?P<indent>[ \t]*)(?P<item>-[ \t]+)?(?:run|'run'|"run"):[ \t]*(?:#.*)?$'''
)
_DEFAULTS_KEY = re.compile(
    r'''[ \t]*(?:defaults|'defaults'|"defaults"):[ \t]*(?:&[\w-]+[ \t]*)?(?:#.*)?$'''
)

_WORKFLOWS_REL = ".github/workflows"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def find_folded_run_steps(text: str) -> list[int]:
    """Return 1-based line numbers of indented plain command values."""
    hits: list[int] = []
    defaults_indent: int | None = None
    pending_run: tuple[int, int] | None = None

    for number, line in enumerate(text.splitlines(), start=1):
        value = line.lstrip(" \t")
        if not value or value.startswith("#"):
            continue

        indent = len(line) - len(value)
        if pending_run is not None:
            run_line, key_indent = pending_run
            if indent > key_indent and not value.startswith(("|", ">", "[", "{")):
                hits.append(run_line)
            pending_run = None

        if defaults_indent is not None:
            if indent > defaults_indent:
                continue
            defaults_indent = None

        if _DEFAULTS_KEY.fullmatch(line):
            defaults_indent = indent
            continue

        match = _RUN_KEY.fullmatch(line)
        if match is not None:
            pending_run = (number, indent + len(match.group("item") or ""))

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
