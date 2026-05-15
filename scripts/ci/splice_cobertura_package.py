#!/usr/bin/env python3
"""Replace a single <package> subtree in a base Cobertura.xml (e.g. from a full merge) with the same package from another Cobertura file."""

from __future__ import annotations

import argparse
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def local_name(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def find_packages_parent(root: ET.Element) -> ET.Element | None:
    for child in root:
        if local_name(child.tag) == "packages":
            return child

    return None


def find_package(packages_parent: ET.Element, name: str) -> tuple[int, ET.Element] | None:
    for i, child in enumerate(packages_parent):
        if local_name(child.tag) != "package":
            continue

        if (child.get("name") or "").strip() == name:
            return i, child

    return None


def clone_element(elem: ET.Element) -> ET.Element:
    return ET.fromstring(ET.tostring(elem, encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True, type=Path, help="Existing merged Cobertura.xml")
    parser.add_argument("--from", dest="from_path", required=True, type=Path, help="Cobertura.xml containing the replacement package")
    parser.add_argument("--package", required=True, help="Package @name to replace (e.g. ArchLucid.Decisioning)")
    parser.add_argument("--out", required=True, type=Path, help="Output Cobertura path")
    args = parser.parse_args()

    base_tree = ET.parse(args.base)
    base_root = base_tree.getroot()
    if base_root is None:
        return 2

    from_tree = ET.parse(args.from_path)
    from_root = from_tree.getroot()
    if from_root is None:
        return 3

    base_pkgs = find_packages_parent(base_root)
    from_pkgs = find_packages_parent(from_root)

    if base_pkgs is None or from_pkgs is None:
        print("Missing <packages> element.", file=sys.stderr)
        return 4

    repl = find_package(from_pkgs, args.package)
    if repl is None:
        print(f"Package {args.package!r} not found in --from file.", file=sys.stderr)
        return 5

    _idx, replacement = repl
    existing = find_package(base_pkgs, args.package)
    if existing is None:
        print(f"Package {args.package!r} not found in --base file.", file=sys.stderr)
        return 6

    pos, old_pkg = existing
    base_pkgs.remove(old_pkg)
    base_pkgs.insert(pos, clone_element(replacement))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    base_tree.write(args.out, encoding="utf-8", xml_declaration=True)
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
