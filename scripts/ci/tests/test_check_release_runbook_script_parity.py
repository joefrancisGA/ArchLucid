"""Unit tests for check_release_runbook_script_parity.py (T1-6)."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CI = REPO_ROOT / "scripts" / "ci"

import sys

sys.path.insert(0, str(CI))

from check_release_runbook_script_parity import check_entry, evaluate_contract, extract_script_params  # noqa: E402


class ReleaseRunbookScriptParityTests(unittest.TestCase):
    def test_extract_script_params_from_sample_block(self) -> None:
        sample = """
param(
    [string] $ApiBaseUrl = 'http://localhost:5128',
    [switch] $SkipDoctor,
    [string] $BearerToken
)
"""
        with tempfile.TemporaryDirectory() as temp_dir:
            script = Path(temp_dir) / "sample.ps1"
            script.write_text(sample, encoding="utf-8")
            names = extract_script_params(script)
            self.assertEqual({"ApiBaseUrl", "SkipDoctor", "BearerToken"}, names)

    def test_repo_contract_passes(self) -> None:
        contract = CI / "data" / "release_runbook_script_contract.v1.json"
        errors, entry_count = evaluate_contract(REPO_ROOT, contract)
        self.assertEqual([], errors, msg="\n".join(errors))
        self.assertGreaterEqual(entry_count, 3)

    def test_detects_missing_doc_flag(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            script = root / "scripts" / "demo.ps1"
            script.parent.mkdir(parents=True)
            script.write_text("param(\n    [switch] $SkipUi\n)\n", encoding="utf-8")
            doc = root / "docs" / "demo.md"
            doc.parent.mkdir(parents=True)
            doc.write_text("Run scripts/demo.ps1 for smoke.\n", encoding="utf-8")
            errors = check_entry(
                root,
                {
                    "script": "scripts/demo.ps1",
                    "docs": ["docs/demo.md"],
                    "requiredParamMentions": ["-SkipUi"],
                },
            )
            self.assertTrue(any("missing documented flag" in item for item in errors))

    def test_detects_missing_script_param(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            script = root / "scripts" / "demo.ps1"
            script.parent.mkdir(parents=True)
            script.write_text("param(\n    [switch] $SkipUi\n)\n", encoding="utf-8")
            doc = root / "docs" / "demo.md"
            doc.parent.mkdir(parents=True)
            doc.write_text("Run scripts/demo.ps1 -SkipUi\n", encoding="utf-8")
            errors = check_entry(
                root,
                {
                    "script": "scripts/demo.ps1",
                    "docs": ["docs/demo.md"],
                    "requiredParamMentions": ["-SkipUi", "-MissingFlag"],
                },
            )
            self.assertTrue(any("param $MissingFlag missing" in item for item in errors))


if __name__ == "__main__":
    unittest.main()
