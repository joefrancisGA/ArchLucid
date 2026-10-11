#!/usr/bin/env python3
"""Check the book's JSON listings: every file parses, and every strict schema obeys strict mode.

Appendix C states the strict structured-output rules: at every object level, ``additionalProperties``
is ``false`` and every property is listed in ``required``, including inside ``$defs``. A schema is
treated as strict when it is wrapped in a ``response_format`` with ``"strict": true``, when it is a
function tool with ``"strict": true``, or when its file name ends in ``.schema.json``.

Usage: python docs/book/tools/check_json_listings.py [--book-root docs/book]
Exit 0 when every file passes, 1 otherwise. Standard library only.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BOOK_ROOT = Path(__file__).resolve().parents[1]
JSON_FOLDER = "lab/listings/json"
SCHEMA_SUFFIX = ".schema.json"
# Keywords whose value is one subschema, a list of subschemas, or a map of named subschemas.
SINGLE = ("items", "additionalItems", "not")
LISTS = ("anyOf", "oneOf", "allOf", "prefixItems")
MAPS = ("properties", "$defs", "definitions")


def is_object_schema(node: dict) -> bool:
    kind = node.get("type")

    return kind == "object" or (isinstance(kind, list) and "object" in kind) or "properties" in node


def node_problems(node: dict, where: str) -> list[str]:
    """Strict-mode problems on one schema node, not counting its children."""
    if not is_object_schema(node):
        return []

    problems = []

    if node.get("additionalProperties") is not False:
        problems.append(f"{where}: additionalProperties must be false")

    properties = set(node.get("properties", {}))
    required = set(node.get("required", []))
    missing = sorted(properties - required)
    extra = sorted(required - properties)

    if missing:
        problems.append(f"{where}: not in required: {', '.join(missing)}")

    if extra:
        problems.append(f"{where}: required but not a property: {', '.join(extra)}")

    return problems


def children(node: dict, where: str) -> list[tuple[dict, str]]:
    """Every subschema directly under node, with its JSON-pointer-like location."""
    found: list[tuple[dict, str]] = []

    for key in SINGLE:
        if isinstance(node.get(key), dict):
            found.append((node[key], f"{where}/{key}"))

    for key in LISTS:
        found += [(item, f"{where}/{key}/{index}") for index, item in enumerate(node.get(key, []))
                  if isinstance(item, dict)]

    for key in MAPS:
        found += [(value, f"{where}/{key}/{name}") for name, value in node.get(key, {}).items()
                  if isinstance(value, dict)]

    return found


def strict_problems(schema: dict, where: str = "#") -> list[str]:
    """Strict-mode problems in schema and every subschema."""
    problems = node_problems(schema, where)

    for child, location in children(schema, where):
        problems += strict_problems(child, location)

    return problems


def strict_schemas(document: object, file_name: str) -> list[tuple[dict, str]]:
    """(schema, location) for every schema in the document that strict mode governs."""
    if file_name.endswith(SCHEMA_SUFFIX) and isinstance(document, dict):
        return [(document, "#")]

    if isinstance(document, dict):
        wrapper = document.get("json_schema")

        if isinstance(wrapper, dict) and wrapper.get("strict") is True:
            return [(wrapper.get("schema") or {}, "#/json_schema/schema")]

        return []

    if isinstance(document, list):
        return [
            (tool["function"].get("parameters") or {}, f"#/{index}/function/parameters")
            for index, tool in enumerate(document)
            if isinstance(tool, dict) and isinstance(tool.get("function"), dict)
            and tool["function"].get("strict") is True
        ]

    return []


def check_file(path: Path) -> list[str]:
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return [f"does not parse: {error}"]

    return [problem for schema, where in strict_schemas(document, path.name)
            for problem in strict_problems(schema, where)]


def schema_count(path: Path) -> int:
    """How many strict schemas a file holds; 0 if it doesn't parse."""
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return 0

    return len(strict_schemas(document, path.name))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check the book's JSON listings.")
    parser.add_argument("--book-root", type=Path, default=BOOK_ROOT)
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    book_root = args.book_root.resolve()
    files = sorted((book_root / JSON_FOLDER).glob("*.json"))
    problems = [f"{path.name}: {problem}" for path in files for problem in check_file(path)]
    schemas = sum(schema_count(path) for path in files)

    for problem in problems:
        print(problem)

    print(f"check_json_listings: {len(files)} file(s), {schemas} strict schema(s), {len(problems)} problem(s)")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
