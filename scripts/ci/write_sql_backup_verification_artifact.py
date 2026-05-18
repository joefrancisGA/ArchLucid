#!/usr/bin/env python3
"""Emit executive-dashboard JSON for Azure SQL backup region / redundancy verification.

Reuses validation from ``assert_sql_backup_regions.py`` (do not duplicate policy logic here).
Typical CI/CD usage after ``terraform show -json`` and a successful assert exit:

  python scripts/ci/write_sql_backup_verification_artifact.py /tmp/tfplan.json \\
      archlucid-ui/public/sql-backup-region-verification.json
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from collections.abc import Mapping
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


_CI_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _CI_DIR.parents[1]


def _load_module(name: str, relative: str):
    path = _CI_DIR / relative
    spec = importlib.util.spec_from_file_location(name, path)

    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {path}")

    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)

    return mod


_assert_sql = _load_module("assert_sql_backup_regions", "assert_sql_backup_regions.py")
_regions = _load_module("assert_terraform_plan_data_regions", "assert_terraform_plan_data_regions.py")

validate_sql_backup_redundancy = _assert_sql.validate_sql_backup_redundancy
_iter_mssql_databases = _assert_sql._iter_mssql_databases
_normalize_requested_backup_redundancy = _assert_sql._normalize_requested_backup_redundancy
_variable_string = _regions._variable_string

_DEFAULT_ALLOWED = frozenset({"Geo", "Zone"})
_ARTIFACT_KIND = "archlucid.sqlBackupRegionVerification.v1"
_SCHEMA_VERSION = "1.0"


def _canonical_redundancies(plan: Mapping[str, Any]) -> list[str]:
    modes: list[str] = []

    for _address, raw in _iter_mssql_databases(plan):
        if raw is None:
            continue

        canonical = _normalize_requested_backup_redundancy(raw)

        if canonical is not None:
            modes.append(canonical)

    return modes


def _display_redundancy(modes: list[str]) -> str | None:
    if not modes:
        return None

    unique = sorted(set(modes))

    if len(unique) == 1:
        return unique[0]

    return f"Mixed ({', '.join(unique)})"


def build_verification_artifact(
    plan: Mapping[str, Any],
    *,
    allowed: frozenset[str],
    require_explicit_redundancy: bool,
    generated_at_utc: datetime | None = None,
) -> dict[str, Any]:
    violations, missing_when_required = validate_sql_backup_redundancy(
        plan,
        allowed=allowed,
        require_explicit_redundancy=require_explicit_redundancy,
    )

    primary_region = _variable_string(plan, "location")
    redundancy_modes = _canonical_redundancies(plan)
    verified = len(violations) == 0 and len(missing_when_required) == 0
    when = generated_at_utc or datetime.now(timezone.utc)

    return {
        "schemaVersion": _SCHEMA_VERSION,
        "kind": _ARTIFACT_KIND,
        "verified": verified,
        "generatedAtUtc": when.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "primaryDataRegion": primary_region,
        "backupStorageRedundancy": _display_redundancy(redundancy_modes),
        "databaseResourceCount": len(list(_iter_mssql_databases(plan))),
        "allowedBackupRedundancyModes": sorted(allowed),
        "violations": [{"address": address, "detail": detail} for address, detail in violations],
        "missingExplicitRedundancy": [address for address, _ in missing_when_required],
        "source": {
            "assertScript": "scripts/ci/assert_sql_backup_regions.py",
            "planInput": "terraform show -json",
        },
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("plan_json", type=Path, help="JSON file emitted by terraform show -json")
    parser.add_argument("output_json", type=Path, help="Path to write the verification artifact")
    parser.add_argument(
        "--allowed",
        nargs="*",
        default=["Geo", "Zone"],
        help="Canonical backup redundancy modes (same semantics as assert_sql_backup_regions.py).",
    )
    parser.add_argument(
        "--require-explicit-redundancy",
        action="store_true",
        help="Mirror assert_sql_backup_regions.py --require-explicit-redundancy.",
    )
    parser.add_argument(
        "--generated-at-utc",
        type=str,
        default=None,
        help="ISO-8601 UTC timestamp for artifact metadata (default: now).",
    )

    return parser.parse_args(argv)


def _resolve_allowed(raw_allowed: list[str]) -> frozenset[str] | None:
    canonical_allowed: set[str] = set()

    for token in raw_allowed:
        if not isinstance(token, str):
            continue

        canonical = _normalize_requested_backup_redundancy(token.strip())

        if canonical is None:
            return None

        canonical_allowed.add(canonical)

    if not canonical_allowed:
        return None

    return frozenset(canonical_allowed)


def main(argv: list[str] | None = None) -> int:
    if argv is None:
        argv = sys.argv[1:]

    args = parse_args(argv)
    allowed = _resolve_allowed(getattr(args, "allowed", []) or [])

    if allowed is None:
        print("write_sql_backup_verification_artifact: invalid or empty --allowed", file=sys.stderr)

        return 2

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

    generated_at: datetime | None = None
    raw_generated = getattr(args, "generated_at_utc", None)

    if isinstance(raw_generated, str) and raw_generated.strip():
        parsed = datetime.fromisoformat(raw_generated.strip().replace("Z", "+00:00"))

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)

        generated_at = parsed.astimezone(timezone.utc)

    artifact = build_verification_artifact(
        plan,
        allowed=allowed,
        require_explicit_redundancy=bool(args.require_explicit_redundancy),
        generated_at_utc=generated_at,
    )

    out_path: Path = args.output_json
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out_path} (verified={artifact['verified']}).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
