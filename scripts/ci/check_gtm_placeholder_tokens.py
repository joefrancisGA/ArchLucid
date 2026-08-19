"""Warn-only CI guard: surface unfilled <<TOKEN>> placeholders in GTM markdown.

Usage:
    python scripts/ci/check_gtm_placeholder_tokens.py [root]

Exit codes (always warn-only per TB-230):
    0 - success (matches printed as WARN lines, or no matches)
    2 - invocation error (root missing or not a directory)
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

DEFAULT_ROOT = pathlib.Path("docs/go-to-market")
TOKEN_PATTERN = re.compile(r"<<([A-Z][A-Z0-9_]*)>>")


def scan_markdown_files(root: pathlib.Path) -> list[str]:
    messages: list[str] = []

    if not root.is_dir():
        return messages

    for path in sorted(root.rglob("*.md")):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            messages.append(f"WARN: could not read {path}: {exc}")
            continue

        for line_number, line in enumerate(text.splitlines(), start=1):
            for match in TOKEN_PATTERN.finditer(line):
                token = match.group(0)
                relative = path.as_posix()
                messages.append(f"WARN: {relative}:{line_number}:{token}")

    return messages


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="List <<TOKEN>> placeholders under docs/go-to-market (warn-only).",
    )
    parser.add_argument(
        "root",
        nargs="?",
        default=str(DEFAULT_ROOT),
        help=f"GTM docs root (default: {DEFAULT_ROOT})",
    )
    args = parser.parse_args(argv)

    root = pathlib.Path(args.root)

    if not root.is_dir():
        print(f"ERROR: GTM root not found: {root}", file=sys.stderr)
        return 2

    messages = scan_markdown_files(root)

    if not messages:
        print(f"OK: no <<TOKEN>> placeholders under {root.as_posix()}")
        return 0

    for message in messages:
        print(message)

    print(
        f"WARN: {len(messages)} <<TOKEN>> placeholder(s) under {root.as_posix()} "
        "(intentional deal-template fields are OK; substitute before buyer send — "
        "see docs/go-to-market/reference-customers/)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
