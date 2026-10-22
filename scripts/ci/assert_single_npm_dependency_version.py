"""Fail when npm reports more than one resolved version for a dependency after npm ci."""

from __future__ import annotations

import argparse
import json
import pathlib
import subprocess
import sys
from typing import Any


def collect_versions(node: dict[str, Any], package_name: str) -> set[str]:
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

        versions.update(collect_versions(info, package_name))

    return versions


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Assert npm ls resolves exactly one version for a package (post npm ci guard)."
    )
    parser.add_argument(
        "package_name",
        nargs="?",
        default="@tanstack/query-core",
        help="npm package name to inspect (default: @tanstack/query-core)",
    )
    parser.add_argument(
        "--prefix",
        type=pathlib.Path,
        default=pathlib.Path("archlucid-ui"),
        help="Directory containing package.json (default: archlucid-ui)",
    )
    args = parser.parse_args(argv)

    prefix = args.prefix.resolve()
    if not (prefix / "package.json").is_file():
        print(f"::error::Missing package.json under {prefix}", file=sys.stderr)
        return 1

    completed = subprocess.run(
        ["npm", "ls", args.package_name, "--all", "--json"],
        cwd=prefix,
        capture_output=True,
        text=True,
        check=False,
    )

    stdout = completed.stdout.strip()
    if not stdout:
        print(
            f"::error::npm ls produced no output for {args.package_name} (exit {completed.returncode})",
            file=sys.stderr,
        )
        if completed.stderr:
            print(completed.stderr, file=sys.stderr)
        return 1

    try:
        tree = json.loads(stdout)
    except json.JSONDecodeError as error:
        print(f"::error::npm ls JSON parse failed: {error}", file=sys.stderr)
        return 1

    versions = collect_versions(tree, args.package_name)
    if len(versions) == 0:
        print(
            f"::error::No resolved version found for {args.package_name} under {prefix}",
            file=sys.stderr,
        )
        return 1

    if len(versions) > 1:
        listed = ", ".join(sorted(versions))
        print(
            f"::error::Expected one {args.package_name} version after npm ci, found: {listed}",
            file=sys.stderr,
        )
        return 1

    print(f"{args.package_name}: {next(iter(versions))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
