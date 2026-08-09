"""Tests for the CD Terraform remote-state assertion."""

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

import cd_assert_terraform_remote_state as assert_state  # noqa: E402


def _write_backend_record(terraform_dir: Path, record: object) -> None:
    """Write a `.terraform/terraform.tfstate` backend record, as `terraform init` would."""
    dot_terraform = terraform_dir / ".terraform"
    dot_terraform.mkdir(parents=True, exist_ok=True)
    payload = record if isinstance(record, str) else json.dumps(record)
    (dot_terraform / "terraform.tfstate").write_text(payload, encoding="utf-8")


def _azurerm_record() -> dict[str, object]:
    """Shape Terraform writes for a configured azurerm backend."""
    return {
        "version": 3,
        "terraform_version": "1.15.8",
        "backend": {
            "type": "azurerm",
            "config": {"key": "container-apps.tfstate"},
            "hash": 123456789,
        },
    }


def _local_record() -> dict[str, object]:
    """Shape Terraform writes for an explicit `backend "local" {}` block (verified on 1.15.8)."""
    return {
        "version": 3,
        "terraform_version": "1.15.8",
        "backend": {
            "type": "local",
            "config": {"path": None, "workspace_dir": None},
            "hash": 666019178,
        },
    }


class BackendRecordPathTests(unittest.TestCase):
    def test_points_at_terraform_backend_record(self) -> None:
        path = assert_state.backend_record_path(Path("infra/terraform-container-apps"))
        self.assertEqual(path.parts[-2:], (".terraform", "terraform.tfstate"))


class ReadBackendRecordTests(unittest.TestCase):
    def test_absent_file_reports_implicit_local_backend(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            record, problem = assert_state.read_backend_record(Path(tmp) / "missing.tfstate")

        self.assertIsNone(record)
        self.assertIsNotNone(problem)
        assert problem is not None
        self.assertIn("no backend record", problem)

    def test_malformed_json_reports_problem(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "terraform.tfstate"
            path.write_text("{not json", encoding="utf-8")
            record, problem = assert_state.read_backend_record(path)

        self.assertIsNone(record)
        self.assertIsNotNone(problem)
        assert problem is not None
        self.assertIn("Could not read", problem)

    def test_non_object_json_reports_problem(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "terraform.tfstate"
            path.write_text("[]", encoding="utf-8")
            record, problem = assert_state.read_backend_record(path)

        self.assertIsNone(record)
        self.assertIsNotNone(problem)
        assert problem is not None
        self.assertIn("not a JSON object", problem)

    def test_valid_record_parses(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "terraform.tfstate"
            path.write_text(json.dumps(_azurerm_record()), encoding="utf-8")
            record, problem = assert_state.read_backend_record(path)

        self.assertIsNone(problem)
        self.assertIsNotNone(record)
        assert record is not None
        self.assertEqual(record["version"], 3)


class BackendTypeTests(unittest.TestCase):
    def test_reads_declared_type(self) -> None:
        self.assertEqual(assert_state.backend_type(_azurerm_record()), "azurerm")

    def test_trims_surrounding_whitespace(self) -> None:
        self.assertEqual(assert_state.backend_type({"backend": {"type": "  azurerm  "}}), "azurerm")

    def test_missing_backend_object_returns_none(self) -> None:
        self.assertIsNone(assert_state.backend_type({"version": 3}))

    def test_non_dict_backend_returns_none(self) -> None:
        self.assertIsNone(assert_state.backend_type({"backend": "azurerm"}))

    def test_null_type_returns_none(self) -> None:
        self.assertIsNone(assert_state.backend_type({"backend": {"type": None}}))

    def test_blank_type_returns_none(self) -> None:
        self.assertIsNone(assert_state.backend_type({"backend": {"type": "   "}}))


class ClassifyTests(unittest.TestCase):
    def test_azurerm_backend_is_remote(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            terraform_dir = Path(tmp)
            _write_backend_record(terraform_dir, _azurerm_record())
            is_remote, detail = assert_state.classify(terraform_dir)

        self.assertTrue(is_remote)
        self.assertIn("azurerm", detail)

    def test_explicit_local_backend_is_not_remote(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            terraform_dir = Path(tmp)
            _write_backend_record(terraform_dir, _local_record())
            is_remote, detail = assert_state.classify(terraform_dir)

        self.assertFalse(is_remote)
        self.assertIn("runner disk", detail)

    def test_no_backend_record_is_not_remote(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            is_remote, detail = assert_state.classify(Path(tmp))

        self.assertFalse(is_remote)
        self.assertIn("implicit local backend", detail)

    def test_missing_directory_is_not_remote(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            is_remote, detail = assert_state.classify(Path(tmp) / "absent")

        self.assertFalse(is_remote)
        self.assertIn("does not exist", detail)

    def test_record_without_type_is_not_remote(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            terraform_dir = Path(tmp)
            _write_backend_record(terraform_dir, {"version": 3, "backend": {}})
            is_remote, detail = assert_state.classify(terraform_dir)

        self.assertFalse(is_remote)
        self.assertIn("does not declare a backend type", detail)

    def test_malformed_record_is_not_remote(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            terraform_dir = Path(tmp)
            _write_backend_record(terraform_dir, "{not json")
            is_remote, detail = assert_state.classify(terraform_dir)

        self.assertFalse(is_remote)
        self.assertIn("Could not read", detail)


class MainTests(unittest.TestCase):
    def _run(self, argv: list[str]) -> tuple[int, str]:
        buffer = io.StringIO()

        with contextlib.redirect_stdout(buffer):
            code = assert_state.main(argv)

        return code, buffer.getvalue()

    def test_remote_state_passes_quietly(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            _write_backend_record(Path(tmp), _azurerm_record())
            code, output = self._run(["--terraform-dir", tmp, "--require-remote"])

        self.assertEqual(code, 0)
        self.assertIn("remote state confirmed", output)
        self.assertNotIn("::error::", output)
        self.assertNotIn("::warning::", output)

    def test_plan_only_run_warns_but_does_not_fail(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            code, output = self._run(["--terraform-dir", tmp])

        self.assertEqual(code, 0)
        self.assertIn("::warning::", output)
        self.assertIn("not checking a real diff", output)
        self.assertIn("TF_BACKEND_TF", output)
        self.assertNotIn("::error::", output)

    def test_apply_run_fails_closed_without_remote_state(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            code, output = self._run(["--terraform-dir", tmp, "--require-remote"])

        self.assertEqual(code, 1)
        self.assertIn("::error::", output)
        self.assertIn("Refusing to apply", output)
        self.assertIn("TF_BACKEND_TF", output)

    def test_apply_run_fails_on_explicit_local_backend(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            _write_backend_record(Path(tmp), _local_record())
            code, output = self._run(["--terraform-dir", tmp, "--require-remote"])

        self.assertEqual(code, 1)
        self.assertIn("::error::", output)


if __name__ == "__main__":
    unittest.main()
