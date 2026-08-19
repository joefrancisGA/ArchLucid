#!/usr/bin/env python3
"""Fail when CodeQL Models-as-Data rows use invalid kind literals for their extensible predicate."""

from __future__ import annotations

import argparse
import ast
import sys
from pathlib import Path

ALLOWED_KINDS: dict[str, frozenset[str]] = {
    "summaryModel": frozenset({"taint", "value"}),
    "neutralModel": frozenset({"summary", "source", "sink"}),
    "barrierModel": frozenset({"log-injection", "file-content-store"}),
}

EXPECTED_KIND_INDEX: dict[str, int] = {
    "summaryModel": 8,
    "neutralModel": 4,
    "barrierModel": 7,
}


def _iter_extension_blocks(path: Path):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    current_extensible: str | None = None
    in_data = False

    for line_number, raw in enumerate(lines, start=1):
        stripped = raw.strip()

        if stripped.startswith("extensible:"):
            current_extensible = stripped.split(":", 1)[1].strip()
            in_data = False
            continue

        if stripped == "data:":
            in_data = current_extensible is not None
            continue

        if not in_data or current_extensible is None:
            continue

        if not stripped.startswith("- ["):
            continue

        literal = stripped[2:].strip().replace("false", "False").replace("true", "True")

        try:
            row = ast.literal_eval(literal)
        except (SyntaxError, ValueError) as exc:
            yield path, line_number, current_extensible, f"could not parse data row: {exc}"
            continue

        if not isinstance(row, list):
            yield path, line_number, current_extensible, "data row is not a list"
            continue

        allowed = ALLOWED_KINDS.get(current_extensible)
        kind_index = EXPECTED_KIND_INDEX.get(current_extensible)

        if allowed is None or kind_index is None:
            continue

        if len(row) <= kind_index:
            yield (
                path,
                line_number,
                current_extensible,
                f"expected at least {kind_index + 1} columns, found {len(row)}",
            )
            continue

        kind = row[kind_index]

        if not isinstance(kind, str):
            yield path, line_number, current_extensible, f"kind column is not a string: {kind!r}"
            continue

        if kind not in allowed:
            allowed_text = ", ".join(sorted(allowed))
            yield (
                path,
                line_number,
                current_extensible,
                f"invalid kind {kind!r}; allowed for {current_extensible}: {allowed_text}",
            )


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Validate CodeQL MaD extension kind literals in model YAML files.",
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        default=[Path(".github/codeql/archlucid-csharp-log-sanitizer-models/models")],
        help="Model YAML files or directories to scan (default: archlucid model pack).",
    )
    parsed = parser.parse_args(argv)

    files: list[Path] = []

    for raw in parsed.paths:
        path = raw.resolve()

        if path.is_dir():
            files.extend(sorted(path.rglob("*.yml")))
            continue

        if path.is_file():
            files.append(path)
            continue

        print(f"::error::{path} is not a file or directory.")
        return 2

    if not files:
        print("::error::No model YAML files found.")
        return 2

    violations = 0

    for file_path in files:
        for path, line_number, extensible, message in _iter_extension_blocks(file_path):
            violations += 1

            try:
                display = path.relative_to(Path.cwd())
            except ValueError:
                display = path

            print(f"::error::{display}:{line_number} [{extensible}] {message}")

    if violations != 0:
        print(f"::error::CodeQL MaD kind validation: {violations} invalid row(s).")
        return 1

    print(f"CodeQL MaD kind validation: OK ({len(files)} file(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
