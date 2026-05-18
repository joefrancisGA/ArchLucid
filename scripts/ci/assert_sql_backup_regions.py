#!/usr/bin/env python3
"""CI guard: ensure planned Azure SQL databases use acceptable backup storage redundancy.

Reads JSON from ``terraform show -json`` (planned state). For each managed
``azurerm_mssql_database`` in ``planned_values``, checks
``requested_backup_storage_redundancy`` when present (non-null/non-empty).

By default redundancy may be omitted (Terraform / provider does not emit a value yet);
use ``--require-explicit-redundancy`` after IaC pins ``requested_backup_storage_redundancy``
on every database.

Examples:

  terraform show -json tfplan > /tmp/tfplan.json
  python scripts/ci/assert_sql_backup_regions.py /tmp/tfplan.json
  python scripts/ci/assert_sql_backup_regions.py /tmp/tfplan.json --allowed Geo Zone GeoZone
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Iterable, Mapping
from pathlib import Path
from typing import Any


_CANON_REDUNDANCY = {
    "geo": "Geo",
    "zone": "Zone",
    "geozone": "GeoZone",
    "local": "Local",
}


def _walk_planned_module_resources(module: Mapping[str, Any]) -> Iterable[Mapping[str, Any]]:
    """Depth-first traversal of Terraform planned_values module tree."""
    for res in module.get("resources") or []:
        if isinstance(res, dict):
            yield res

    for child in module.get("child_modules") or []:
        if isinstance(child, dict):
            yield from _walk_planned_module_resources(child)


def _planned_root(plan: Mapping[str, Any]) -> Mapping[str, Any] | None:
    planned = plan.get("planned_values")
    if not isinstance(planned, dict):
        return None
    root = planned.get("root_module")
    return root if isinstance(root, dict) else None


def _normalize_requested_backup_redundancy(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        return None
    condensed = "".join(value.split()).lower()

    return _CANON_REDUNDANCY.get(condensed)


def _iter_mssql_databases(plan: Mapping[str, Any]) -> list[tuple[str, str | None]]:
    """Returns addresses and redundancy values for azurerm_mssql_database in planned_values."""
    root = _planned_root(plan)

    if root is None:
        return []

    tuples: list[tuple[str, str | None]] = []

    for res in _walk_planned_module_resources(root):
        if res.get("type") != "azurerm_mssql_database" or res.get("mode") != "managed":
            continue

        address = str(res.get("address") or res.get("name") or "<unknown>")
        values = res.get("values")
        redundancy: Any = None

        if isinstance(values, dict):
            redundancy = values.get("requested_backup_storage_redundancy")

        if redundancy is None or (isinstance(redundancy, str) and not redundancy.strip()):
            tuples.append((address, None))

            continue

        if isinstance(redundancy, str):
            tuples.append((address, redundancy.strip()))

            continue

        tuples.append((address, str(redundancy)))

    return tuples


def validate_sql_backup_redundancy(
    plan: Mapping[str, Any],
    *,
    allowed: frozenset[str],
    require_explicit_redundancy: bool,
) -> tuple[list[tuple[str, str]], list[tuple[str, str | None]]]:
    """

    Returns (violations, missing_when_required).

    * violations — ``(address, detail)``: explicit value absent from ``allowed``.
    * missing_when_required — ``(address, None)``: explicit setting required but missing/null.
    """

    violations: list[tuple[str, str]] = []
    missing_when_required: list[tuple[str, str | None]] = []
    databases = list(_iter_mssql_databases(plan))

    for address, raw in databases:
        if raw is None:
            if require_explicit_redundancy:
                missing_when_required.append((address, None))

            continue

        canonical = _normalize_requested_backup_redundancy(raw)

        if canonical is None:
            violations.append((address, f"unrecognized requested_backup_storage_redundancy={raw!r}"))

            continue

        if canonical not in allowed:
            violations.append(
                (
                    address,
                    f"requested_backup_storage_redundancy={canonical} not in allowed {{{', '.join(sorted(allowed))}}}",
                )
            )

    return violations, missing_when_required


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])

    parser.add_argument(
        "plan_json",
        type=Path,
        help="JSON file emitted by terraform show -json",
    )

    parser.add_argument(
        "--allowed",
        nargs="*",
        default=["Geo", "Zone"],
        help="Canonical Azure backup redundancy modes to allow (case-insensitive). Default: Geo Zone",
    )

    parser.add_argument(
        "--require-explicit-redundancy",
        action="store_true",
        help="Fail when azurerm_mssql_database omits requested_backup_storage_redundancy (unset/null).",
    )

    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    if argv is None:
        argv = sys.argv[1:]

    args = parse_args(argv)
    raw_allowed = getattr(args, "allowed", []) or []

    canonical_allowed: set[str] = set()

    for token in raw_allowed:
        if not isinstance(token, str):
            continue

        c = _normalize_requested_backup_redundancy(token.strip())

        if c is None:
            print(f"assert_sql_backup_regions: invalid --allowed token {token!r}", file=sys.stderr)

            return 2

        canonical_allowed.add(c)

    if not canonical_allowed:
        print("assert_sql_backup_regions: --allowed resolved empty set", file=sys.stderr)

        return 2

    allowed_frozen = frozenset(canonical_allowed)
    path = args.plan_json

    if not path.is_file():
        print(f"Not a file: {path}", file=sys.stderr)

        return 2

    try:
        plan = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON: {path}: {exc}", file=sys.stderr)

        return 2

    if not isinstance(plan, dict):
        print("Plan JSON root must be an object.", file=sys.stderr)

        return 2

    violations, missing_when_required = validate_sql_backup_redundancy(
        plan,
        allowed=allowed_frozen,
        require_explicit_redundancy=bool(args.require_explicit_redundancy),
    )

    if missing_when_required:
        print("assert_sql_backup_regions: missing requested_backup_storage_redundancy:", file=sys.stderr)

        for address, _ in missing_when_required:
            print(f"  {address}", file=sys.stderr)

        return 1

    if violations:
        print("assert_sql_backup_regions: backup redundancy violations:", file=sys.stderr)

        for address, detail in violations:
            print(f"  {address}: {detail}", file=sys.stderr)

        return 1

    count = len(list(_iter_mssql_databases(plan)))
    suffix = ""

    if count == 0:
        suffix = " (no azurerm_mssql_database resources in planned_values)"

    print(f"OK: Azure SQL backup redundancy policy satisfied for {count} database resource(s){suffix}.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
