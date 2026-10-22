#!/usr/bin/env python3
"""Tracked @archlucid/api-types split files must match archlucid-ui/src/lib/api-types/."""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

_SYNCED_FILES: tuple[str, ...] = (
    "paths.generated.ts",
    "schemas.generated.ts",
    "index.ts",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def file_digest(path: Path) -> str:
    payload = path.read_bytes()
    return hashlib.sha256(payload).hexdigest()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    ui_dir = root / "archlucid-ui" / "src" / "lib" / "api-types"
    package_dir = root / "archlucid-ui" / "packages" / "api-types" / "src" / "api-types"
    errors: list[str] = []

    if not ui_dir.is_dir():
        errors.append(f"missing {ui_dir.relative_to(root)}")

    if not package_dir.is_dir():
        errors.append(f"missing {package_dir.relative_to(root)}")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    for relative_name in _SYNCED_FILES:
        ui_path = ui_dir / relative_name
        package_path = package_dir / relative_name

        if not ui_path.is_file():
            errors.append(f"missing {ui_path.relative_to(root)}")

            continue

        if not package_path.is_file():
            errors.append(f"missing {package_path.relative_to(root)}")

            continue

        if file_digest(ui_path) != file_digest(package_path):
            errors.append(
                f"{package_path.relative_to(root)} is out of sync with "
                f"{ui_path.relative_to(root)}; run "
                f"`cd archlucid-ui && npm run build:api-types` and commit packages/api-types/",
            )

    if errors:
        for error in errors:
            print(f"check_api_types_package_in_sync: {error}", file=sys.stderr)

        return 1

    print("check_api_types_package_in_sync: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
