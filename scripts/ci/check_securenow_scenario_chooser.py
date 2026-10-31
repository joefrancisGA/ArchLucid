#!/usr/bin/env python3
"""Validate SecureNow scenario chooser and fixture packs.

Run from repo root: python scripts/ci/check_securenow_scenario_chooser.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHOOSER = ROOT / "docs/securenow/SCENARIO_CHOOSER.md"
PACKS_DIR = ROOT / "docs/securenow/scenario-packs"
EXEC_TEMPLATE = ROOT / "docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md"

REQUIRED_PACKS = (
    "public-storage-path.md",
    "collection-gap.md",
    "advisory-cut-no-write.md",
    "later-capture-not-verified.md",
    "contributor-role-between-snapshots.md",
)

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
STARTER_PACK_PREFIX = "templates/starter-proof-packs/"
MIN_EXEC_NOT_COLLECTED = 5
MIN_CHOOSER_ROWS = 4
MAX_CHOOSER_ROWS = 6


def _resolve_link(base: Path, target: str) -> Path:
    path_part = target.split("#", 1)[0]
    if not path_part:
        return base
    return (base.parent / path_part).resolve()


def _check_links(text: str, base: Path, label: str, errors: list[str]) -> None:
    for match in LINK_RE.finditer(text):
        target = match.group(1)
        if target.startswith("http"):
            continue
        path_part = target.split("#", 1)[0]
        if not path_part:
            continue
        resolved = _resolve_link(base, target)
        if not resolved.is_file():
            errors.append(f"{label}: broken link {target!r}")


def _chooser_data_rows(text: str) -> list[str]:
    rows: list[str] = []
    in_table = False
    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if not stripped.startswith("|"):
            if in_table and rows:
                break
            continue
        if "---" in stripped.replace(" ", ""):
            in_table = True
            continue
        if not in_table:
            continue
        if stripped.lower().startswith("| scenario"):
            continue
        rows.append(stripped)
    return rows


def _forbidden_starter_links(
    text: str, base: Path, repo_root: Path, label: str, errors: list[str]
) -> None:
    prefix = STARTER_PACK_PREFIX.casefold()
    for match in LINK_RE.finditer(text):
        target = match.group(1)
        if target.startswith("http"):
            continue
        path_part = target.split("#", 1)[0]
        if not path_part:
            continue
        if prefix in path_part.replace("\\", "/").casefold():
            errors.append(f"{label}: must not link under {STARTER_PACK_PREFIX!r}")
            continue
        resolved = _resolve_link(base, target)
        try:
            rel = resolved.relative_to(repo_root.resolve())
        except ValueError:
            continue
        if rel.as_posix().casefold().startswith(prefix):
            errors.append(f"{label}: must not link under {STARTER_PACK_PREFIX!r}")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []

    chooser_path = root / "docs/securenow/SCENARIO_CHOOSER.md"
    packs_dir = root / "docs/securenow/scenario-packs"
    exec_path = root / "docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md"

    if not chooser_path.is_file():
        errors.append("chooser: missing docs/securenow/SCENARIO_CHOOSER.md")
        return errors

    chooser_text = chooser_path.read_text(encoding="utf-8")
    row_count = len(_chooser_data_rows(chooser_text))
    if row_count < MIN_CHOOSER_ROWS or row_count > MAX_CHOOSER_ROWS:
        errors.append(
            f"chooser: expected {MIN_CHOOSER_ROWS}–{MAX_CHOOSER_ROWS} data rows, found {row_count}"
        )

    for pack_name in REQUIRED_PACKS:
        pack_path = packs_dir / pack_name
        if not pack_path.is_file():
            errors.append(f"pack: missing scenario-packs/{pack_name}")

    if "not customer evidence" not in chooser_text.casefold():
        errors.append("chooser: must contain 'not customer evidence'")

    _check_links(chooser_text, chooser_path, "chooser", errors)
    _forbidden_starter_links(chooser_text, chooser_path, root, "chooser", errors)

    for pack_name in REQUIRED_PACKS:
        pack_path = packs_dir / pack_name
        if not pack_path.is_file():
            continue
        pack_text = pack_path.read_text(encoding="utf-8")
        if "not customer evidence" not in pack_text.casefold():
            errors.append(f"pack {pack_name}: must contain 'not customer evidence'")
        if "Do not say" not in pack_text:
            errors.append(f"pack {pack_name}: must contain heading 'Do not say'")
        _check_links(pack_text, pack_path, f"pack {pack_name}", errors)
        _forbidden_starter_links(pack_text, pack_path, root, f"pack {pack_name}", errors)

    if exec_path.is_file():
        not_collected_count = exec_path.read_text(encoding="utf-8").count("NOT COLLECTED")
        if not_collected_count < MIN_EXEC_NOT_COLLECTED:
            errors.append(
                f"executive_template: expected at least {MIN_EXEC_NOT_COLLECTED} "
                f"occurrences of 'NOT COLLECTED', found {not_collected_count}"
            )
    else:
        errors.append("executive_template: missing EXECUTIVE_PROOF_PACKET_TEMPLATE.md")

    return errors


def main() -> int:
    errors = validate()
    for err in errors:
        print(err)
    if errors:
        return 1
    print("SecureNow scenario chooser: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
