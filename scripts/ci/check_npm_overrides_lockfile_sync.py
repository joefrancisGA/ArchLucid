#!/usr/bin/env python3
"""Fail when package.json overrides pin versions that package-lock.json does not resolve."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

_EXACT_VERSION_PATTERN = re.compile(r"^\d+\.\d+\.\d+(-[\w.]+)?$")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def collect_string_overrides(overrides: object) -> dict[str, str]:
    if not isinstance(overrides, dict):
        return {}

    pinned: dict[str, str] = {}

    for name, value in overrides.items():
        if not isinstance(name, str):
            continue

        if isinstance(value, str) and not value.startswith("$") and _EXACT_VERSION_PATTERN.match(value):
            pinned[name] = value

    return pinned


def lockfile_resolved_version(packages: dict[str, Any], package_name: str) -> str | None:
    entry = packages.get(f"node_modules/{package_name}")

    if not isinstance(entry, dict):
        return None

    version = entry.get("version")

    if version is None:
        return None

    return str(version)


def check_prefix(prefix: Path) -> list[str]:
    package_json_path = prefix / "package.json"
    lockfile_path = prefix / "package-lock.json"
    errors: list[str] = []

    if not package_json_path.is_file():
        errors.append(f"missing {package_json_path}")

        return errors

    if not lockfile_path.is_file():
        errors.append(f"missing {lockfile_path}")

        return errors

    try:
        package_json = json.loads(package_json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        errors.append(f"invalid package.json JSON: {error}")

        return errors

    try:
        lockfile = json.loads(lockfile_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        errors.append(f"invalid package-lock.json JSON: {error}")

        return errors

    packages = lockfile.get("packages")

    if not isinstance(packages, dict):
        errors.append("package-lock.json missing packages map (lockfile v2/v3 required)")

        return errors

    overrides = collect_string_overrides(package_json.get("overrides"))

    for package_name, expected_version in sorted(overrides.items()):
        resolved_version = lockfile_resolved_version(packages, package_name)

        if resolved_version is None:
            errors.append(
                f"{package_name}: override pins {expected_version} but lockfile has no "
                f"node_modules/{package_name} entry; run npm install in {prefix.name}/ and commit package-lock.json",
            )

            continue

        if resolved_version != expected_version:
            errors.append(
                f"{package_name}: package.json override is {expected_version} but "
                f"package-lock.json resolves {resolved_version}; run npm install in {prefix.name}/ and commit package-lock.json",
            )

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--prefix",
        type=Path,
        default=Path("archlucid-ui"),
        help="Directory containing package.json and package-lock.json (default: archlucid-ui)",
    )
    args = parser.parse_args(argv)

    prefix = args.prefix.resolve()
    errors = check_prefix(prefix)

    if errors:
        for error in errors:
            print(f"check_npm_overrides_lockfile_sync: {error}", file=sys.stderr)

        return 1

    print("check_npm_overrides_lockfile_sync: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
