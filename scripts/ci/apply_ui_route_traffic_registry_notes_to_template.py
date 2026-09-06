#!/usr/bin/env python3
"""Copy registry row notes/paths/sections into the tracked traffic workbook template."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from archlucid_ui_route_catalog import DEFAULT_NEW_HIT_PCT
from archlucid_ui_route_traffic_table import (
    DEFAULT_DONE,
    REPO_ROOT,
    TEMPLATE_DOC,
    parse_rows,
    sanitize_note_text,
    sort_rows,
    split_document,
    write_table,
)

UI_LIB = REPO_ROOT / "archlucid-ui" / "src" / "lib"
EXPORT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "export-ui-route-traffic-registry.ts"

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


def parse_registry_rows_from_typescript() -> dict[str, dict[str, str]]:
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as handle:
        output_path = Path(handle.name)

    try:
        subprocess.run(
            [
                "npx",
                "tsx",
                str(EXPORT_SCRIPT),
                str(output_path),
            ],
            cwd=REPO_ROOT / "archlucid-ui",
            check=True,
        )
        rows = json.loads(output_path.read_text(encoding="utf-8"))
    finally:
        output_path.unlink(missing_ok=True)

    patches: dict[str, dict[str, str]] = {}

    for row in rows:
        patches[row["rowId"]] = {
            "path": row["path"],
            "section": row["section"],
            "notes": row["note"],
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
    patches = parse_registry_rows_from_typescript()
    patches.update(parse_standalone_modules())

    text = doc.read_text(encoding="utf-8")
    before, table_body, after = split_document(text, doc)
    by_id = {row["id"]: row for row in parse_rows(table_body)}

    updated = 0
    added = 0

    for row_id, patch in sorted(patches.items()):
        sanitized_notes = sanitize_note_text(patch["notes"])

        if row_id in by_id:
            row = by_id[row_id]

            if patch.get("path"):
                row["path"] = patch["path"]

            row["section"] = patch["section"]
            row["notes"] = sanitized_notes
            updated += 1
            continue

        by_id[row_id] = {
            "id": row_id,
            "path": patch.get("path", ""),
            "pct": DEFAULT_NEW_HIT_PCT,
            "score": "0",
            "section": patch["section"],
            "done": DEFAULT_DONE,
            "notes": sanitized_notes,
        }
        added += 1

    sorted_rows = sort_rows(list(by_id.values()))
    write_table(doc, before, sorted_rows, after)
    print(
        f"Applied registry notes: updated {updated}, added {added}, "
        f"total {len(sorted_rows)} rows in {doc.relative_to(REPO_ROOT)}",
    )
    return updated + added


def main() -> int:
    if not TEMPLATE_DOC.is_file():
        print(f"Missing template: {TEMPLATE_DOC}", file=sys.stderr)
        return 1

    apply_template()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
