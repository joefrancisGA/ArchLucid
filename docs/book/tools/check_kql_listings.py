#!/usr/bin/env python3
"""Structure-check the book's KQL listings. There is no offline KQL compiler, so this is not a parse.

For every ``.kql`` file under ``lab/listings/kql`` and ``lab/queries``, it checks that brackets and
quotes balance, that the query starts with a table the book uses, and that it doesn't start with a
pipe (a fragment that only makes sense after another query). Leading ``let`` statements are allowed.
The live validation runbook (``lab/live-validation-runbook.md``) is what proves a query runs.

Usage: python docs/book/tools/check_kql_listings.py [--book-root docs/book]
Exit 0 when every file passes, 1 otherwise. Standard library only.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

BOOK_ROOT = Path(__file__).resolve().parents[1]
KQL_FOLDERS = ("lab/listings/kql", "lab/queries")
KNOWN_TABLES = frozenset({
    "resources", "resourcecontainers", "authorizationresources", "resourcechanges",
    "StorageBlobLogs", "AzureActivity", "AuditLogs",
})
OPENERS = {"(": ")", "[": "]", "{": "}"}
FIRST_WORD = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def mask_line(line: str) -> tuple[str, bool]:
    """(line with comments removed and string contents blanked, whether a string was left open).

    KQL strings don't span lines, so each line is scanned on its own. Quote characters are kept,
    so 'x' becomes ' ' with its quotes, and brackets or semicolons inside strings disappear.
    """
    masked: list[str] = []
    quote: str | None = None
    index = 0

    while index < len(line):
        char = line[index]

        if quote:
            if char == "\\" and not quote.startswith("@"):
                masked.append("  ")
                index += 2
                continue

            closes = char == quote[-1]
            masked.append(char if closes else " ")
            quote = None if closes else quote
        elif line.startswith("//", index):
            break
        elif line.startswith(("@'", '@"'), index):
            # Verbatim string: backslashes are literal, so only the closing quote ends it.
            quote = "@" + line[index + 1]
            masked.append("@" + line[index + 1])
            index += 1
        else:
            quote = char if char in "'\"" else None
            masked.append(char)

        index += 1

    return "".join(masked), quote is not None


def mask(text: str) -> tuple[str, bool]:
    """Mask every line; the flag is True if any line leaves a string open."""
    lines = [mask_line(line) for line in text.splitlines()]

    return "\n".join(code for code, _ in lines), any(open_string for _, open_string in lines)


def balance_problems(code: str) -> list[str]:
    """Unbalanced brackets in masked code."""
    stack: list[str] = []

    for char in code:
        if char in OPENERS:
            stack.append(OPENERS[char])
        elif char in OPENERS.values() and (not stack or stack.pop() != char):
            return [f"unexpected '{char}'"]

    return [f"unclosed bracket, expected '{stack[-1]}'"] if stack else []


def statements(code: str) -> list[str]:
    """Top-level statements split on ';' (KQL lets end with one); empty ones are dropped."""
    return [part.strip() for part in code.split(";") if part.strip()]


def start_problems(code: str) -> list[str]:
    """The query body must start with a known table, after any 'let' statements."""
    parts = statements(code)

    if not parts:
        return ["empty query"]

    body = parts[-1]

    if any(not part.startswith("let ") for part in parts[:-1]):
        return ["only 'let' statements may come before the query"]

    if body.startswith("|"):
        return ["starts with '|': a fragment, not a query"]

    word = FIRST_WORD.match(body)

    if word is None or word.group(0) not in KNOWN_TABLES:
        found = word.group(0) if word else body[:1]
        return [f"starts with '{found}', which is not a known table"]

    return []


def check_text(text: str) -> list[str]:
    code, open_string = mask(text)
    strings = ["unterminated string"] if open_string else []

    return strings + balance_problems(code) + start_problems(code)


def kql_files(book_root: Path) -> list[Path]:
    return sorted(path for folder in KQL_FOLDERS for path in (book_root / folder).glob("*.kql"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Structure-check the book's KQL listings.")
    parser.add_argument("--book-root", type=Path, default=BOOK_ROOT)
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    book_root = args.book_root.resolve()
    files = kql_files(book_root)
    problems = [
        f"{path.relative_to(book_root).as_posix()}: {problem}"
        for path in files
        for problem in check_text(path.read_text(encoding="utf-8"))
    ]

    for problem in problems:
        print(problem)

    print(f"check_kql_listings: {len(files)} file(s), {len(problems)} problem(s)")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
