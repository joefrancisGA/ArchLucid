"""Ensure archlucid-ui pins Next.js 16.3.6+ and lockfile / npm ls agree with package.json."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys
from typing import Any

MIN_NEXT_VERSION = (16, 3, 6)


def parse_semver(value: str) -> tuple[int, int, int]:
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)", value.strip())
    if match is None:
        raise ValueError(f"not a semver prefix: {value!r}")
    return int(match.group(1)), int(match.group(2)), int(match.group(3))


def read_package_next_pin(package_json: pathlib.Path) -> str:
    payload = json.loads(package_json.read_text(encoding="utf-8"))
    dependencies = payload.get("dependencies")
    if not isinstance(dependencies, dict):
        raise ValueError("package.json missing dependencies")
    pin = dependencies.get("next")
    if not isinstance(pin, str) or pin.strip() == "":
        raise ValueError("package.json dependencies.next is missing")
    return pin.strip()


def read_lockfile_next_version(lockfile: pathlib.Path) -> str:
    payload = json.loads(lockfile.read_text(encoding="utf-8"))
    packages = payload.get("packages")
    if not isinstance(packages, dict):
        raise ValueError("package-lock.json missing packages map")
    entry = packages.get("node_modules/next")
    if not isinstance(entry, dict):
        raise ValueError("package-lock.json missing node_modules/next entry")
    version = entry.get("version")
    if not isinstance(version, str) or version.strip() == "":
        raise ValueError("package-lock.json node_modules/next.version is missing")
    return version.strip()


def collect_npm_ls_versions(node: dict[str, Any], package_name: str) -> set[str]:
    versions: set[str] = set()

    if node.get("name") == package_name and node.get("version"):
        versions.add(str(node["version"]))

    dependencies = node.get("dependencies")
    if not isinstance(dependencies, dict):
        return versions

    for name, info in dependencies.items():
        if not isinstance(info, dict):
            continue
        if name == package_name and info.get("version"):
            versions.add(str(info["version"]))
        versions.update(collect_npm_ls_versions(info, package_name))

    return versions


def read_installed_next_version(prefix: pathlib.Path) -> str:
    completed = subprocess.run(
        ["npm", "ls", "next", "--all", "--json"],
        cwd=prefix,
        capture_output=True,
        text=True,
        check=False,
    )
    stdout = completed.stdout.strip()
    if not stdout:
        raise RuntimeError(f"npm ls next produced no output (exit {completed.returncode})")

    tree = json.loads(stdout)
    versions = collect_npm_ls_versions(tree, "next")
    if len(versions) != 1:
        listed = ", ".join(sorted(versions)) if versions else "(none)"
        raise RuntimeError(f"expected one installed next version, found: {listed}")

    return next(iter(versions))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Assert archlucid-ui Next.js pin, lockfile, and optional npm ls alignment."
    )
    parser.add_argument(
        "--prefix",
        type=pathlib.Path,
        default=pathlib.Path("archlucid-ui"),
        help="Directory containing package.json (default: archlucid-ui)",
    )
    parser.add_argument(
        "--skip-npm-ls",
        action="store_true",
        help="Do not require node_modules / npm ls (lockfile + package.json only).",
    )
    args = parser.parse_args(argv)

    prefix = args.prefix.resolve()
    package_json = prefix / "package.json"
    lockfile = prefix / "package-lock.json"

    if not package_json.is_file():
        print(f"::error::Missing {package_json}", file=sys.stderr)
        return 1
    if not lockfile.is_file():
        print(f"::error::Missing {lockfile}", file=sys.stderr)
        return 1

    try:
        pin = read_package_next_pin(package_json)
        lock_version = read_lockfile_next_version(lockfile)
    except (ValueError, json.JSONDecodeError) as error:
        print(f"::error::{error}", file=sys.stderr)
        return 1

    if pin != lock_version:
        print(
            f"::error::package.json pins next@{pin} but package-lock.json resolves next@{lock_version}",
            file=sys.stderr,
        )
        return 1

    try:
        if parse_semver(lock_version) < MIN_NEXT_VERSION:
            minimum = ".".join(str(part) for part in MIN_NEXT_VERSION)
            print(
                f"::error::next@{lock_version} is below security floor next@{minimum} (#3599)",
                file=sys.stderr,
            )
            return 1
    except ValueError as error:
        print(f"::error::{error}", file=sys.stderr)
        return 1

    if not args.skip_npm_ls and (prefix / "node_modules" / "next").is_dir():
        try:
            installed = read_installed_next_version(prefix)
        except (RuntimeError, json.JSONDecodeError) as error:
            print(f"::error::{error}", file=sys.stderr)
            return 1

        if installed != pin:
            print(
                f"::error::node_modules has next@{installed} but package.json pins next@{pin} — run npm ci",
                file=sys.stderr,
            )
            return 1

    print(f"next pin OK: {pin}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
