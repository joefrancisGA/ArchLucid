#!/usr/bin/env python3
"""Copy registry row notes/paths/sections into the tracked traffic workbook template."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    REPO_ROOT,
    TEMPLATE_DOC,
    sanitize_note_text,
)

UI_LIB = REPO_ROOT / "archlucid-ui" / "src" / "lib"
REGISTRY_DIR = UI_LIB / "ui-route-traffic"

ROW_BLOCK = re.compile(
    r"rowId:\s*\"(?P<row_id>[A-Z0-9]{2,4})\".*?path:\s*\"(?P<path>[^\"]+)\".*?"
    r"section:\s*\"(?P<section>[^\"]+)\".*?note:\s*\"(?P<note>(?:[^\"\\]|\\.)*)\"",
    re.DOTALL,
)

STANDALONE_ROW_ID = re.compile(
    r"export const (?P<prefix>\w+)_TRAFFIC_ROW_ID = \"(?P<row_id>[A-Z0-9]{2,4})\";",
)
STANDALONE_PATH = re.compile(r"export const (?P<prefix>\w+)_TRAFFIC_PATH = (?P<value>[^;]+);")
STANDALONE_SECTION = re.compile(
    r"export const (?P<prefix>\w+)_TRAFFIC_SECTION = \"(?P<section>[^\"]+)\";",
)
STANDALONE_NOTE = re.compile(
    r"export const (?P<prefix>\w+)_TRAFFIC_NOTE =\s*\"(?P<note>(?:[^\"\\]|\\.)*)\";",
    re.DOTALL,
)
STANDALONE_PATH_CONST = re.compile(r"export const (?P<name>\w+) = \"(?P<path>[^\"]+)\";")
STRING_LITERAL = re.compile(r"^\"((?:[^\"\\]|\\.)*)\"$")


def _decode_ts_string(value: str) -> str:
    return bytes(value, "utf-8").decode("unicode_escape")


def _resolve_path_literal(text: str, raw: str) -> str | None:
    raw = raw.strip()
    match = STRING_LITERAL.match(raw)

    if match is not None:
        return _decode_ts_string(match.group(1))

    identifier = re.match(r"^([A-Z0-9_]+)$", raw)

    if identifier is None:
        return None

    name = identifier.group(1)

    for const in STANDALONE_PATH_CONST.finditer(text):
        if const.group("name") == name:
            return const.group("path")

    return None


def parse_registry_rows() -> dict[str, dict[str, str]]:
    patches: dict[str, dict[str, str]] = {}

    for path in sorted(REGISTRY_DIR.glob("*-rows.ts")):
        text = path.read_text(encoding="utf-8")

        for match in ROW_BLOCK.finditer(text):
            patches[match.group("row_id")] = {
                "path": match.group("path"),
                "section": match.group("section"),
                "notes": _decode_ts_string(match.group("note")),
            }

    return patches


def parse_standalone_modules() -> dict[str, dict[str, str]]:
    patches: dict[str, dict[str, str]] = {}

    for path in sorted(UI_LIB.glob("ui-route-traffic-*.ts")):
        if path.name.endswith(".test.ts"):
            continue

        text = path.read_text(encoding="utf-8")
        row_id_match = STANDALONE_ROW_ID.search(text)

        if row_id_match is None:
            continue

        prefix = row_id_match.group("prefix")
        row_id = row_id_match.group("row_id")
        path_match = STANDALONE_PATH.search(text)
        section_match = STANDALONE_SECTION.search(text)
        note_match = STANDALONE_NOTE.search(text)

        if path_match is None or section_match is None or note_match is None:
            continue

        if path_match.group("prefix") != prefix:
            continue

        resolved_path = _resolve_path_literal(text, path_match.group("value"))
        patch: dict[str, str] = {
            "section": section_match.group("section"),
            "notes": _decode_ts_string(note_match.group("note")),
        }

        if resolved_path is not None:
            patch["path"] = resolved_path

        patches[row_id] = patch

    return patches


def apply_template(doc: Path = TEMPLATE_DOC) -> int:
    patches = parse_registry_rows()
    patches.update(parse_standalone_modules())

    lines = doc.read_text(encoding="utf-8").splitlines()
    updated = 0
    in_table = False

    for index, line in enumerate(lines):
        if line.startswith("## Master table"):
            in_table = True
            continue

        if in_table and line.startswith("---"):
            in_table = False
            continue

        if not in_table or not line.startswith("| ") or line.startswith("| ID") or line.startswith("|----"):
            continue

        parts = [part.strip() for part in line.strip("|").split("|")]

        if len(parts) not in (7, 8, 9):
            continue

        row_id = parts[0]
        patch = patches.get(row_id)

        if patch is None:
            continue

        if len(parts) == 7:
            parts[5] = patch["section"]
            parts[6] = sanitize_note_text(patch["notes"])
        elif len(parts) == 8:
            parts[6] = patch["section"]
            parts[7] = sanitize_note_text(patch["notes"])
        else:
            parts[6] = patch["section"]
            parts[8] = sanitize_note_text(patch["notes"])

        lines[index] = "| " + " | ".join(parts) + " |"
        updated += 1

    doc.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Applied registry notes to {updated} rows in {doc.relative_to(REPO_ROOT)}")
    return updated


def main() -> int:
    if not TEMPLATE_DOC.is_file():
        print(f"Missing template: {TEMPLATE_DOC}", file=sys.stderr)
        return 1

    apply_template()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
