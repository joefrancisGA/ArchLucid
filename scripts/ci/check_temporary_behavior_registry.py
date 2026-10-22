#!/usr/bin/env python3
"""Fail when temporary compatibility behavior is missing ownership or has expired."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

REQUIRED_FIELDS = ("id", "owner", "expiresOn", "reason", "replacement")


def check_registry(path: Path, today: date | None = None) -> list[str]:
    today = today or date.today()
    try:
        entries = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"cannot read registry: {error}"]

    if not isinstance(entries, list):
        return ["registry root must be a JSON array"]

    errors: list[str] = []
    seen_ids: set[str] = set()
    for index, entry in enumerate(entries):
        prefix = f"entry {index + 1}"
        if not isinstance(entry, dict):
            errors.append(f"{prefix}: must be an object")
            continue

        missing = [field for field in REQUIRED_FIELDS if not str(entry.get(field, "")).strip()]
        if missing:
            errors.append(f"{prefix}: missing required field(s): {', '.join(missing)}")

        entry_id = str(entry.get("id", "")).strip()
        if entry_id and entry_id in seen_ids:
            errors.append(f"{prefix}: duplicate id {entry_id}")
        if entry_id:
            seen_ids.add(entry_id)

        expires_on = str(entry.get("expiresOn", "")).strip()
        if expires_on:
            try:
                expiry = date.fromisoformat(expires_on)
            except ValueError:
                errors.append(f"{prefix}: expiresOn must use YYYY-MM-DD")
            else:
                if expiry < today:
                    errors.append(f"{prefix}: {entry_id or 'temporary behavior'} expired on {expires_on}")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--path", type=Path, default=Path("scripts/ci/data/temporary-behaviors.json"))
    args = parser.parse_args(argv)
    errors = check_registry(args.path.resolve())
    if errors:
        for error in errors:
            print(f"check_temporary_behavior_registry: {error}", file=sys.stderr)
        return 1

    print("check_temporary_behavior_registry: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
