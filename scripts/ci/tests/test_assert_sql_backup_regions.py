"""Unit tests for assert_sql_backup_regions."""
from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]

_SPEC = importlib.util.spec_from_file_location(
    "assert_sql_backup_regions",
    _REPO / "scripts" / "ci" / "assert_sql_backup_regions.py",
)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError("Could not load assert_sql_backup_regions.py")
_mod = importlib.util.module_from_spec(_SPEC)
sys.modules["assert_sql_backup_regions"] = _mod
_SPEC.loader.exec_module(_mod)

validate_sql_backup_redundancy = _mod.validate_sql_backup_redundancy
_iter_mssql_databases = _mod._iter_mssql_databases


def _minimal_plan(*, planned_root_resources: list[dict]) -> dict:
    return {
        "planned_values": {"root_module": {"resources": planned_root_resources, "child_modules": []}},
    }


def _mssql_database(address: str, redundancy: str | None) -> dict:
    payload: dict = {"address": address, "mode": "managed", "type": "azurerm_mssql_database", "values": {}}

    if redundancy is None:
        return payload

    payload["values"] = {"requested_backup_storage_redundancy": redundancy}

    return payload


class TestSqlBackupRedundancy(unittest.TestCase):
    def test_no_databases_returns_empty(self) -> None:
        plan = _minimal_plan(planned_root_resources=[])
        self.assertEqual(_iter_mssql_databases(plan), [])

        v, missing = validate_sql_backup_redundancy(
            plan, allowed=frozenset({"Geo", "Zone"}), require_explicit_redundancy=False
        )

        self.assertEqual(v, [])
        self.assertEqual(missing, [])

    def test_omitted_redundancy_allowed_without_strict(self) -> None:
        resource = _mssql_database("module.pool.azurerm_mssql_database.system", None)

        plan = _minimal_plan(planned_root_resources=[resource])
        v, missing = validate_sql_backup_redundancy(
            plan, allowed=frozenset({"Geo", "Zone"}), require_explicit_redundancy=False
        )

        self.assertEqual(v, [])
        self.assertEqual(missing, [])

    def test_explicit_local_violates(self) -> None:
        resource = _mssql_database("azurerm_mssql_database.app", "Local")

        plan = _minimal_plan(planned_root_resources=[resource])

        v, missing = validate_sql_backup_redundancy(
            plan, allowed=frozenset({"Geo", "Zone"}), require_explicit_redundancy=False
        )

        self.assertEqual(missing, [])
        self.assertEqual(len(v), 1)

        self.assertIn("Local", v[0][1])

    def test_geo_accepted(self) -> None:
        resource = _mssql_database("azurerm_mssql_database.app", "Geo")

        plan = _minimal_plan(planned_root_resources=[resource])

        v, missing = validate_sql_backup_redundancy(
            plan, allowed=frozenset({"Geo", "Zone"}), require_explicit_redundancy=False
        )

        self.assertEqual(v + missing, [])

    def test_geozone_requires_allowlist_when_default_geo_zone_only(self) -> None:
        resource = _mssql_database("azurerm_mssql_database.app", "GeoZone")

        plan = _minimal_plan(planned_root_resources=[resource])

        v, missing = validate_sql_backup_redundancy(
            plan, allowed=frozenset({"Geo", "Zone"}), require_explicit_redundancy=False
        )

        self.assertEqual(missing, [])
        self.assertEqual(len(v), 1)

        accepted = validate_sql_backup_redundancy(
            plan, allowed=frozenset({"Geo", "Zone", "GeoZone"}), require_explicit_redundancy=False
        )

        self.assertEqual(accepted[0] + accepted[1], [])

    def test_require_explicit_flags_missing_rows(self) -> None:
        resource = _mssql_database("azurerm_mssql_database.no_attr", None)

        plan = _minimal_plan(planned_root_resources=[resource])

        violations, missing = validate_sql_backup_redundancy(
            plan, allowed=frozenset({"Geo", "Zone"}), require_explicit_redundancy=True
        )

        self.assertEqual(violations, [])
        self.assertEqual(missing, [("azurerm_mssql_database.no_attr", None)])

    def test_walks_nested_child_modules(self) -> None:
        inner = {"resources": [_mssql_database("module.pool.azurerm_mssql_database.sys", "Local")], "child_modules": []}
        root = {"resources": [], "child_modules": [inner]}

        plan = {"planned_values": {"root_module": root}}

        tuples = _iter_mssql_databases(plan)
        self.assertEqual(len(tuples), 1)
        self.assertEqual(tuples[0][1], "Local")


class TestMainCli(unittest.TestCase):
    def test_invalid_allowed_exit_code_two(self) -> None:
        script = _REPO / "scripts" / "ci" / "assert_sql_backup_regions.py"

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as handle:
            handle.write("{}")
            path = handle.name

        try:

            outcome = subprocess.run(
                [sys.executable, str(script), path, "--allowed", "Mars"], capture_output=True, text=True, check=False
            )

            self.assertEqual(outcome.returncode, 2)
        finally:
            Path(path).unlink(missing_ok=True)
