"""Tests for the CD worker SQL configuration heal planner."""

from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

_CI = Path(__file__).resolve().parents[1]

if str(_CI) not in sys.path:
    sys.path.insert(0, str(_CI))

import cd_heal_worker_sql_config as heal  # noqa: E402

_TENANT_TEMPLATE_NAME = "ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate"


def _api_entries() -> list[dict[str, str]]:
    """Env entries shaped like the live dev API app (all SQL settings are literal values)."""
    return [
        {"name": "ArchLucid__StorageProvider", "value": "Sql"},
        {"name": "ArchLucid__SqlTopology__Mode", "value": "SystemWithPerTenantCatalogs"},
        {"name": "ConnectionStrings__ArchLucid", "value": "Server=tcp:sql;Initial Catalog=A;User Id=u"},
        {"name": "ConnectionStrings__ArchLucidSystem", "value": "Server=tcp:sql;Initial Catalog=S"},
        {"name": _TENANT_TEMPLATE_NAME, "value": "Server=tcp:sql;Initial Catalog={0}"},
        {"name": "ARCHLUCID_BUILD_COMMIT_SHA", "value": "abc123"},
    ]


def _worker_entries() -> list[dict[str, str]]:
    """Env entries shaped like the live dev worker app before the heal (no SQL settings at all)."""
    return [
        {"name": "ASPNETCORE_URLS", "value": "http://0.0.0.0:8080"},
        {"name": "Hosting__Role", "value": "Worker"},
    ]


class ParseEnvEntriesTests(unittest.TestCase):
    def test_returns_empty_for_none(self) -> None:
        self.assertEqual(heal.parse_env_entries(None), [])

    def test_returns_empty_for_blank(self) -> None:
        self.assertEqual(heal.parse_env_entries(""), [])

    def test_returns_empty_for_malformed_json(self) -> None:
        self.assertEqual(heal.parse_env_entries("{not json"), [])

    def test_returns_empty_for_non_array(self) -> None:
        self.assertEqual(heal.parse_env_entries('{"name":"x"}'), [])

    def test_drops_non_object_members(self) -> None:
        parsed = heal.parse_env_entries('[{"name":"a","value":"1"}, "junk", 7, null]')
        self.assertEqual(parsed, [{"name": "a", "value": "1"}])


class IndexByNameTests(unittest.TestCase):
    def test_last_duplicate_wins(self) -> None:
        indexed = heal.index_by_name(
            [{"name": "a", "value": "first"}, {"name": "a", "value": "second"}]
        )
        self.assertEqual(indexed["a"]["value"], "second")

    def test_skips_missing_empty_and_non_string_names(self) -> None:
        indexed = heal.index_by_name(
            [{"value": "no-name"}, {"name": "", "value": "blank"}, {"name": 5, "value": "num"}]
        )
        self.assertEqual(indexed, {})


class ValueResolutionTests(unittest.TestCase):
    def test_literal_value_returns_value(self) -> None:
        indexed = heal.index_by_name([{"name": "a", "value": "v"}])
        self.assertEqual(heal.literal_value(indexed, "a"), "v")

    def test_literal_value_none_when_absent(self) -> None:
        self.assertIsNone(heal.literal_value({}, "a"))

    def test_literal_value_none_when_empty_or_non_string(self) -> None:
        indexed = heal.index_by_name([{"name": "a", "value": ""}, {"name": "b", "value": 5}])
        self.assertIsNone(heal.literal_value(indexed, "a"))
        self.assertIsNone(heal.literal_value(indexed, "b"))

    def test_literal_value_none_for_secret_reference(self) -> None:
        indexed = heal.index_by_name([{"name": "a", "secretRef": "my-secret"}])
        self.assertIsNone(heal.literal_value(indexed, "a"))

    def test_secret_reference_resolves(self) -> None:
        indexed = heal.index_by_name([{"name": "a", "secretRef": "my-secret"}])
        self.assertEqual(heal.secret_reference(indexed, "a"), "my-secret")

    def test_secret_reference_none_when_absent_empty_or_non_string(self) -> None:
        indexed = heal.index_by_name(
            [{"name": "a", "secretRef": ""}, {"name": "b", "secretRef": 9}, {"name": "c", "value": "v"}]
        )
        self.assertIsNone(heal.secret_reference({}, "a"))
        self.assertIsNone(heal.secret_reference(indexed, "a"))
        self.assertIsNone(heal.secret_reference(indexed, "b"))
        self.assertIsNone(heal.secret_reference(indexed, "c"))

    def test_is_bound_covers_literal_secret_and_absent(self) -> None:
        indexed = heal.index_by_name(
            [{"name": "lit", "value": "v"}, {"name": "ref", "secretRef": "s"}, {"name": "empty", "value": ""}]
        )
        self.assertTrue(heal.is_bound(indexed, "lit"))
        self.assertTrue(heal.is_bound(indexed, "ref"))
        self.assertFalse(heal.is_bound(indexed, "empty"))
        self.assertFalse(heal.is_bound(indexed, "missing"))


class SensitivityTests(unittest.TestCase):
    def test_connection_string_names_are_sensitive(self) -> None:
        self.assertTrue(heal.is_sensitive("ConnectionStrings__ArchLucid"))
        self.assertTrue(heal.is_sensitive(_TENANT_TEMPLATE_NAME))

    def test_topology_mode_and_provider_are_not_sensitive(self) -> None:
        self.assertFalse(heal.is_sensitive("ArchLucid__SqlTopology__Mode"))
        self.assertFalse(heal.is_sensitive("ArchLucid__StorageProvider"))


class PlanPairsTests(unittest.TestCase):
    def test_mirrors_every_api_value_missing_from_worker(self) -> None:
        pairs = heal.plan_pairs(
            heal.index_by_name(_api_entries()), heal.index_by_name(_worker_entries())
        )
        self.assertEqual(
            [name for name, _ in pairs],
            [
                "ArchLucid__StorageProvider",
                "ArchLucid__SqlTopology__Mode",
                "ConnectionStrings__ArchLucid",
                "ConnectionStrings__ArchLucidSystem",
                _TENANT_TEMPLATE_NAME,
            ],
        )

    def test_skips_names_already_matching_to_avoid_revision_churn(self) -> None:
        api_indexed = heal.index_by_name(_api_entries())
        worker = _worker_entries() + _api_entries()
        self.assertEqual(heal.plan_pairs(api_indexed, heal.index_by_name(worker)), [])

    def test_replans_when_worker_value_differs(self) -> None:
        worker = _worker_entries() + [
            {"name": "ConnectionStrings__ArchLucid", "value": "Server=tcp:stale"}
        ]
        pairs = heal.plan_pairs(heal.index_by_name(_api_entries()), heal.index_by_name(worker))
        self.assertIn("ConnectionStrings__ArchLucid", [name for name, _ in pairs])

    def test_skips_names_the_api_does_not_define(self) -> None:
        pairs = heal.plan_pairs(heal.index_by_name([]), heal.index_by_name(_worker_entries()))
        self.assertEqual(pairs, [])

    def test_skips_api_secret_references_because_values_cannot_be_read(self) -> None:
        api = [{"name": "ConnectionStrings__ArchLucid", "secretRef": "sql-conn"}]
        pairs = heal.plan_pairs(heal.index_by_name(api), heal.index_by_name(_worker_entries()))
        self.assertEqual(pairs, [])


class PlanFailuresTests(unittest.TestCase):
    def test_no_failures_when_api_can_supply_everything(self) -> None:
        failures = heal.plan_failures(
            heal.index_by_name(_api_entries()), heal.index_by_name(_worker_entries())
        )
        self.assertEqual(failures, [])

    def test_no_failures_when_worker_already_bound(self) -> None:
        worker = _worker_entries() + [
            {"name": "ArchLucid__SqlTopology__Mode", "value": "SystemWithPerTenantCatalogs"},
            {"name": "ConnectionStrings__ArchLucid", "secretRef": "sql-conn"},
            {"name": "ConnectionStrings__ArchLucidSystem", "value": "Server=tcp:sql"},
            {"name": _TENANT_TEMPLATE_NAME, "value": "Server=tcp:sql;Initial Catalog={0}"},
        ]
        self.assertEqual(heal.plan_failures(heal.index_by_name([]), heal.index_by_name(worker)), [])

    def test_reports_secret_reference_on_api_as_unmirrorable(self) -> None:
        api = [
            {"name": "ArchLucid__SqlTopology__Mode", "value": "SystemWithPerTenantCatalogs"},
            {"name": "ConnectionStrings__ArchLucid", "secretRef": "sql-conn"},
            {"name": "ConnectionStrings__ArchLucidSystem", "value": "Server=tcp:sql"},
            {"name": _TENANT_TEMPLATE_NAME, "value": "tpl"},
        ]
        failures = heal.plan_failures(heal.index_by_name(api), heal.index_by_name(_worker_entries()))
        self.assertEqual(len(failures), 1)
        self.assertIn("Container App secret", failures[0])

    def test_reports_every_required_name_when_both_apps_are_bare(self) -> None:
        failures = heal.plan_failures(heal.index_by_name([]), heal.index_by_name([]))
        self.assertEqual(len(failures), len(heal.REQUIRED_NAMES))
        self.assertTrue(all("nothing to mirror" in failure for failure in failures))


class VerifyFailuresTests(unittest.TestCase):
    def test_passes_when_worker_carries_required_names(self) -> None:
        worker = _worker_entries() + _api_entries()
        self.assertEqual(heal.verify_failures(heal.index_by_name(worker)), [])

    def test_accepts_secret_references_as_bound(self) -> None:
        worker = [{"name": name, "secretRef": "s"} for name in heal.REQUIRED_NAMES]
        self.assertEqual(heal.verify_failures(heal.index_by_name(worker)), [])

    def test_reports_missing_names(self) -> None:
        failures = heal.verify_failures(heal.index_by_name(_worker_entries()))
        self.assertEqual(len(failures), len(heal.REQUIRED_NAMES))


class ArgFormattingTests(unittest.TestCase):
    def test_format_set_env_args(self) -> None:
        self.assertEqual(heal.format_set_env_args([("A", "1"), ("B", "x=y;z")]), ["A=1", "B=x=y;z"])

    def test_find_multiline_names_detects_both_newline_styles(self) -> None:
        pairs = [("A", "one"), ("B", "two\nlines"), ("C", "three\rlines")]
        self.assertEqual(heal.find_multiline_names(pairs), ["B", "C"])

    def test_write_set_env_args_writes_one_pair_per_line(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "args.txt"
            heal.write_set_env_args(path, [("A", "1"), ("B", "2")])
            self.assertEqual(path.read_text(encoding="utf-8"), "A=1\nB=2\n")

    def test_write_set_env_args_writes_empty_file_when_nothing_to_change(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "args.txt"
            heal.write_set_env_args(path, [])
            self.assertEqual(path.read_text(encoding="utf-8"), "")


class EmitMasksTests(unittest.TestCase):
    def test_masks_only_sensitive_values(self) -> None:
        buffer = io.StringIO()

        with contextlib.redirect_stdout(buffer):
            heal.emit_masks([("ConnectionStrings__ArchLucid", "secret-conn"), ("ArchLucid__StorageProvider", "Sql")])

        output = buffer.getvalue()
        self.assertIn("::add-mask::secret-conn", output)
        self.assertNotIn("::add-mask::Sql", output)


class MainTests(unittest.TestCase):
    def _run(self, argv: list[str]) -> tuple[int, str]:
        buffer = io.StringIO()

        with contextlib.redirect_stdout(buffer):
            code = heal.main(argv)

        return code, buffer.getvalue()

    def test_plan_writes_args_file_and_masks_connection_strings(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "args.txt"
            code, output = self._run(
                [
                    "--api-env-json",
                    json.dumps(_api_entries()),
                    "--worker-env-json",
                    json.dumps(_worker_entries()),
                    "--set-env-args-out",
                    str(path),
                ]
            )
            self.assertEqual(code, 0)
            self.assertIn("Mirroring worker SQL configuration", output)
            self.assertIn("::add-mask::Server=tcp:sql;Initial Catalog=A;User Id=u", output)
            lines = path.read_text(encoding="utf-8").splitlines()
            self.assertIn("ArchLucid__StorageProvider=Sql", lines)
            self.assertEqual(len(lines), 5)

    def test_plan_writes_empty_file_when_already_in_sync(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "args.txt"
            code, output = self._run(
                [
                    "--api-env-json",
                    json.dumps(_api_entries()),
                    "--worker-env-json",
                    json.dumps(_worker_entries() + _api_entries()),
                    "--set-env-args-out",
                    str(path),
                ]
            )
            self.assertEqual(code, 0)
            self.assertIn("already matches", output)
            self.assertEqual(path.read_text(encoding="utf-8"), "")

    def test_plan_without_output_file_still_succeeds(self) -> None:
        code, _ = self._run(["--api-env-json", json.dumps(_api_entries())])
        self.assertEqual(code, 0)

    def test_plan_fails_when_required_config_is_unavailable(self) -> None:
        code, output = self._run(["--api-env-json", "[]", "--worker-env-json", "[]"])
        self.assertEqual(code, 1)
        self.assertIn("::error::WORKER CONFIG:", output)
        self.assertIn("cannot start", output)

    def test_plan_fails_on_multiline_value(self) -> None:
        api = _api_entries() + [{"name": "ConnectionStrings__ArchLucid", "value": "line1\nline2"}]
        code, output = self._run(["--api-env-json", json.dumps(api), "--worker-env-json", "[]"])
        self.assertEqual(code, 1)
        self.assertIn("multi-line", output)

    def test_verify_only_passes_for_configured_worker(self) -> None:
        code, output = self._run(
            ["--worker-env-json", json.dumps(_worker_entries() + _api_entries()), "--verify-only"]
        )
        self.assertEqual(code, 0)
        self.assertIn("completeness check passed", output)

    def test_verify_only_fails_for_bare_worker(self) -> None:
        code, output = self._run(
            ["--worker-env-json", json.dumps(_worker_entries()), "--verify-only"]
        )
        self.assertEqual(code, 1)
        self.assertIn("is not set on the worker app", output)

    def test_verify_only_ignores_api_values(self) -> None:
        """Verification must reflect the worker's own state, not what the API could supply."""
        code, _ = self._run(
            [
                "--api-env-json",
                json.dumps(_api_entries()),
                "--worker-env-json",
                json.dumps(_worker_entries()),
                "--verify-only",
            ]
        )
        self.assertEqual(code, 1)


class ParseArgsTests(unittest.TestCase):
    def test_defaults(self) -> None:
        args = heal.parse_args([])
        self.assertEqual(args.api_env_json, "[]")
        self.assertEqual(args.worker_env_json, "[]")
        self.assertIsNone(args.set_env_args_out)
        self.assertFalse(args.verify_only)


if __name__ == "__main__":
    unittest.main()
