"""TB-328: correctness guardrails drift checks (severity contract + TB-320–327 wiring)."""

from __future__ import annotations

import json
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCorrectnessGuardrailsBatch328(unittest.TestCase):
    def test_tb_328_finding_severity_contract_json(self) -> None:
        contract_path = REPO_ROOT / "docs" / "library" / "FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT.json"
        payload = json.loads(contract_path.read_text(encoding="utf-8"))
        mappings = payload.get("mappings", [])
        self.assertEqual(len(mappings), 4)
        names = [entry["enumName"] for entry in mappings]
        self.assertEqual(names, ["Info", "Warning", "Error", "Critical"])

    def test_tb_328_design_tokens_map_warning_and_error(self) -> None:
        tokens = (REPO_ROOT / "archlucid-ui" / "src" / "lib" / "design-tokens.ts").read_text(
            encoding="utf-8"
        )
        self.assertIn('case "warning":', tokens)
        self.assertIn('return "warning";', tokens)
        self.assertIn('case "error":', tokens)
        self.assertIn('return "error";', tokens)
        self.assertIn('warning: "Warning"', tokens)
        self.assertIn('error: "Error"', tokens)

    def test_tb_320_run_detail_kpi_contract_present(self) -> None:
        json_path = REPO_ROOT / "docs" / "library" / "RUN_DETAIL_KPI_SEMANTIC_CONTRACT.json"
        ts_path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "runs" / "run-detail-kpi-semantic-contract.ts"
        self.assertTrue(json_path.is_file())
        self.assertTrue(ts_path.is_file())

    def test_tb_255_256_faithfulness_guards_present(self) -> None:
        checker = (
            REPO_ROOT
            / "ArchLucid.AgentRuntime"
            / "Evaluation"
            / "AgentResultEvidenceFaithfulnessChecker.cs"
        ).read_text(encoding="utf-8")
        report = (
            REPO_ROOT / "ArchLucid.Contracts" / "Agents" / "AgentResultEvidenceFaithfulnessReport.cs"
        ).read_text(encoding="utf-8")
        self.assertIn("MeetsOverlapThreshold", checker)
        self.assertIn("HasCheckableContent", report)

    def test_tb_325_prompt_injection_guard_script_present(self) -> None:
        guard = REPO_ROOT / "scripts" / "ci" / "assert_prompt_injection_guard.py"
        self.assertTrue(guard.is_file())
        ci = (REPO_ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        self.assertIn("assert_prompt_injection_guard.py", ci)


if __name__ == "__main__":
    unittest.main()
