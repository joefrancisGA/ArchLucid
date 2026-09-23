#!/usr/bin/env python3
"""Fail when the installed UI lint toolchain drifts from the TypeScript 7 setup."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def read_package_version(path: Path) -> str | None:
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None

    version = package.get("version")
    return str(version) if version is not None else None


def major(version: str | None) -> int | None:
    if version is None:
        return None

    try:
        return int(version.split(".", 1)[0])
    except ValueError:
        return None


def check_prefix(prefix: Path) -> list[str]:
    package_json_path = prefix / "package.json"
    node_modules = prefix / "node_modules"
    errors: list[str] = []

    if not package_json_path.is_file():
        return [f"missing {package_json_path}"]

    try:
        package = json.loads(package_json_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"invalid package.json: {error}"]

    dev_dependencies = package.get("devDependencies", {})
    if dev_dependencies.get("eslint") != "^9.39.5":
        errors.append("package.json must pin eslint to ^9.39.5")
    if dev_dependencies.get("typescript") != "npm:@typescript/typescript6@^6.0.2":
        errors.append("package.json must use the TypeScript 6 API alias for typescript")
    if dev_dependencies.get("@typescript/native") != "npm:typescript@^7.0.2":
        errors.append("package.json must keep @typescript/native on TypeScript 7")

    expected = {
        "eslint": (node_modules / "eslint" / "package.json", 9),
        "typescript": (node_modules / "typescript" / "package.json", 6),
        "@typescript/native": (node_modules / "@typescript" / "native" / "package.json", 7),
    }
    for name, (path, expected_major) in expected.items():
        version = read_package_version(path)
        if version is None:
            errors.append(f"missing installed {name} under {path}")
        elif major(version) != expected_major:
            errors.append(f"installed {name} is {version}; expected major {expected_major}")

    typescript_eslint = list(node_modules.glob("**/typescript-eslint/package.json"))
    if not typescript_eslint:
        errors.append("missing installed typescript-eslint package")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--prefix",
        type=Path,
        default=Path("archlucid-ui"),
        help="Directory containing package.json and node_modules (default: archlucid-ui)",
    )
    args = parser.parse_args(argv)

    errors = check_prefix(args.prefix.resolve())
    if errors:
        for error in errors:
            print(f"check_ui_lint_toolchain: {error}", file=sys.stderr)
        return 1

    print("check_ui_lint_toolchain: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
