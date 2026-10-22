"""Tests for weekly UI npm audit runner (TB-864)."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_module(name: str, script_name: str):
    script = _CI / script_name
    spec = importlib.util.spec_from_file_location(name, script)

    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script_name}")

    sys.path.insert(0, str(_CI))
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


AUDIT = _load_module("run_ui_npm_audit", "run_ui_npm_audit.py")


class RunUiNpmAuditTests(unittest.TestCase):
    def test_evaluate_clean_report_passes(self) -> None:
        report = {
            "metadata": {
                "vulnerabilities": {
                    "info": 0,
                    "low": 0,
                    "moderate": 0,
                    "high": 0,
                    "critical": 0,
                    "total": 0,
                }
            },
            "vulnerabilities": {},
        }

        evaluation = AUDIT.evaluate_audit_report(report)

        self.assertTrue(evaluation.passed)
        self.assertEqual(evaluation.failing_packages, ())

    def test_evaluate_high_severity_fails(self) -> None:
        report = {
            "metadata": {
                "vulnerabilities": {
                    "info": 0,
                    "low": 0,
                    "moderate": 0,
                    "high": 1,
                    "critical": 0,
                    "total": 1,
                }
            },
            "vulnerabilities": {
                "example-pkg": {
                    "severity": "high",
                    "isDirect": True,
                }
            },
        }

        evaluation = AUDIT.evaluate_audit_report(report)

        self.assertFalse(evaluation.passed)
        self.assertEqual(evaluation.failing_packages, ("example-pkg",))

    def test_moderate_only_report_passes(self) -> None:
        report = {
            "metadata": {
                "vulnerabilities": {
                    "info": 0,
                    "low": 0,
                    "moderate": 2,
                    "high": 0,
                    "critical": 0,
                    "total": 2,
                }
            },
            "vulnerabilities": {
                "moderate-pkg": {
                    "severity": "moderate",
                    "isDirect": False,
                }
            },
        }

        evaluation = AUDIT.evaluate_audit_report(report)

        self.assertTrue(evaluation.passed)

    def test_main_writes_outputs_and_exits_nonzero_on_failure(self) -> None:
        fixture = {
            "metadata": {
                "vulnerabilities": {
                    "info": 0,
                    "low": 0,
                    "moderate": 0,
                    "high": 0,
                    "critical": 1,
                    "total": 1,
                }
            },
            "vulnerabilities": {
                "critical-pkg": {
                    "severity": "critical",
                }
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            fixture_path = temp_path / "audit.json"
            fixture_path.write_text(json.dumps(fixture), encoding="utf-8")
            json_out = temp_path / "out.json"
            markdown_out = temp_path / "out.md"

            exit_code = AUDIT.main(
                [
                    "--input-json",
                    str(fixture_path),
                    "--json-out",
                    str(json_out),
                    "--markdown-out",
                    str(markdown_out),
                ]
            )

            self.assertEqual(exit_code, 1)
            self.assertTrue(json_out.is_file())
            self.assertTrue(markdown_out.is_file())
            payload = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(payload["summary"]["disposition"], "FAIL")
            self.assertIn("FAIL", markdown_out.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
