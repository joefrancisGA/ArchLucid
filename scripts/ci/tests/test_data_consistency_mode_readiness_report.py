"""Tests for scripts/data_consistency_mode_readiness_report.py (offline, no DB)."""
from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_LOADED_SCRIPT = None


def _load_script_module():
    global _LOADED_SCRIPT
    if _LOADED_SCRIPT is not None:
        return _LOADED_SCRIPT

    script_path = _REPO / "scripts/data_consistency_mode_readiness_report.py"
    spec = importlib.util.spec_from_file_location("consistency_mode_readiness", script_path)
    module = importlib.util.module_from_spec(spec)
    loader = spec.loader

    assert loader is not None
    sys.modules[spec.name] = module

    loader.exec_module(module)
    _LOADED_SCRIPT = module
    return module


class TestDataConsistencyModeReadinessReport(unittest.TestCase):
    def test_script_writes_markdown(self):
        script = _REPO / "scripts/data_consistency_mode_readiness_report.py"
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "out.md"
            result = subprocess.run(
                [sys.executable, str(script), "--out", str(out)],
                cwd=_REPO,
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            text = out.read_text(encoding="utf-8")

            self.assertIn("mode readiness report", text.lower())

            self.assertIn("WITH NOCHECK", text)

            self.assertIn("archlucid_data_consistency_orphans_detected_total", text)

            self.assertIn("| Check | Result | Detail |", text)

            self.assertIn("Passed", text)

            self.assertIn("Not captured", text)

    def test_strict_exit_code_when_mode_invalid(self):
        script = _REPO / "scripts/data_consistency_mode_readiness_report.py"
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / "bad.json"
            bad.write_text(
                '{"DataConsistency":{"Enforcement":{"Mode":"DefinitelyNotValidMode","AutoQuarantine":false}}}',
                encoding="utf-8",
            )
            result = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    "--config",
                    str(bad),
                    "--no-default-appsettings",
                    "--strict-exit-code",
                    "--out",
                    str(Path(tmp) / "o.md"),
                ],
                cwd=_REPO,
                check=False,
            )

            self.assertEqual(result.returncode, 1)


class TestDataConsistencyReadinessUnit(unittest.TestCase):
    def setUp(self):
        self.mod = _load_script_module()

    def test_validate_enforcement_mode_accepted_literals(self):

        modes = ("OFF", "warn", "ALERT", "quaRantIne")

        for token in modes:
            lowered, err = self.mod.validate_enforcement_mode(token)

            self.assertIsNone(err, token)
            self.assertEqual(lowered, token.strip().lower())

    def test_validate_enforcement_mode_omitted_vs_invalid(self):
        self.assertEqual(self.mod.validate_enforcement_mode(None), (None, None))

        bad, err = self.mod.validate_enforcement_mode("nope")

        self.assertIsNone(bad)
        self.assertIsNotNone(err)

    def test_readiness_row_rejects_bad_status(self):
        with self.assertRaises(ValueError):
            self.mod.ReadinessRow(name="x", status="maybe", detail="y")

    def test_deep_merge_nested(self):
        base = {"DataConsistency": {"Enforcement": {"Mode": "Warn", "AlertThreshold": 1}}}
        over = {"DataConsistency": {"Enforcement": {"Mode": "Alert"}}}

        merged = self.mod.deep_merge(base, over)

        self.assertEqual(merged["DataConsistency"]["Enforcement"]["Mode"], "Alert")
        self.assertEqual(merged["DataConsistency"]["Enforcement"]["AlertThreshold"], 1)

    def test_quarantine_safe_structural_ok_not_captured_brownfield(self):
        a, b = self.mod.quarantine_safe_to_enable_rows("quarantine", False, True, True)

        self.assertEqual(a.status, "Passed")
        self.assertEqual(b.status, "Not captured")

    def test_format_report_contains_operator_checklist(self):
        rows = [
            self.mod.ReadinessRow(name="Sample", status="Passed", detail="ok"),
        ]
        md = self.mod.format_report_markdown(rows, ["## Posture", ""])

        self.assertIn("Operator checklist", md)

        self.assertIn("Sample", md)


if __name__ == "__main__":
    unittest.main()
