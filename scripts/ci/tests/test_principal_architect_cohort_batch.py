"""Batch tests for principal-architect cohort runner and CI guard."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
BATCH_SCRIPT = REPO_ROOT / "scripts" / "ci" / "run_principal_architect_cohort_batch.py"
GUARD_SCRIPT = REPO_ROOT / "scripts" / "ci" / "guard_principal_architect_cohort.py"
ASSEMBLE = REPO_ROOT / "scripts" / "assemble_blind_validation_packet.py"
FIXTURE = REPO_ROOT / "fixtures" / "blind-validation" / "regulated-scenario"
PA_TEMPLATE = REPO_ROOT / "docs" / "go-to-market" / "templates" / "principal-architect-session.template.json"


def _run(script: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(script), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class PrincipalArchitectCohortBatchTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="pa-cohort-batch-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _write_principal_session(self, root: Path, session_id: str, reuse_intent: str, n_count: int, x_count: int) -> None:
        payload = json.loads(PA_TEMPLATE.read_text(encoding="utf-8"))
        payload["sessionId"] = session_id
        payload["sessionUtc"] = "2026-06-16T12:00:00Z"
        payload["reuseIntent"] = reuse_intent
        payload["decisionImpactMedian"] = 4.0
        payload["sourceCounts"]["archlucid"].update({"N": n_count, "O": 1, "U": 1, "X": x_count, "S": 0})
        payload["sourceCounts"]["manualFrontierAi"].update({"N": 1, "O": 2, "U": 1, "X": 0, "S": 0})
        folder = root / session_id
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "session.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    def _write_blind_session(self, root: Path, session_id: str, reuse_intent: str, classification: str) -> None:
        output = root / session_id
        assemble = _run(
            ASSEMBLE,
            "assemble",
            "--fixture",
            str(FIXTURE),
            "--output",
            str(output),
            "--seed",
            "42",
            "--session-id",
            session_id,
        )
        self.assertEqual(0, assemble.returncode, msg=assemble.stderr)

        scoring_path = output / "scoring-sheet.json"
        scoring = json.loads(scoring_path.read_text(encoding="utf-8"))

        for rating in scoring["ratings"]:
            rating["novelty"] = 4
            rating["correctnessConfidence"] = 5
            rating["actionability"] = 4
            rating["surpriseFactor"] = 4
            rating["decisionImpact"] = 5
            rating["classification"] = classification

        scoring["sessionMetadata"]["reuseIntent"] = reuse_intent
        scoring_path.write_text(json.dumps(scoring, indent=2) + "\n", encoding="utf-8")

        summarize = _run(
            ASSEMBLE,
            "summarize",
            "--scoring-sheet",
            str(scoring_path),
            "--packet",
            str(output / "blind-packet.json"),
            "--output",
            str(output),
        )
        self.assertEqual(0, summarize.returncode, msg=summarize.stderr)

    def test_batch_passes_with_three_sessions(self) -> None:
        principal_root = self.temp_dir / "principal"
        blind_root = self.temp_dir / "blind"
        self._write_principal_session(principal_root, "pa-1", "yes", n_count=4, x_count=0)
        self._write_principal_session(principal_root, "pa-2", "maybe", n_count=3, x_count=0)
        self._write_blind_session(blind_root, "bl-1", "yes", "N")

        out_json = self.temp_dir / "report.json"
        out_md = self.temp_dir / "report.md"
        result = _run(
            BATCH_SCRIPT,
            "--principal-dir",
            str(principal_root),
            "--blind-dir",
            str(blind_root),
            "--json-out",
            str(out_json),
            "--markdown-out",
            str(out_md),
        )
        self.assertEqual(0, result.returncode, msg=result.stderr)

        payload = json.loads(out_json.read_text(encoding="utf-8"))
        self.assertEqual(3, payload["sessionCount"])
        self.assertTrue(payload["messagingReady"])
        self.assertIn(payload["disposition"], {"PASS", "HOLD"})
        self.assertIsNotNone(payload["metrics"]["decisionImpactMedian"]["value"])
        self.assertTrue(out_md.is_file())

    def test_batch_insufficient_evidence_with_one_session(self) -> None:
        principal_root = self.temp_dir / "principal"
        self._write_principal_session(principal_root, "pa-1", "yes", n_count=2, x_count=0)

        out_json = self.temp_dir / "report.json"
        result = _run(
            BATCH_SCRIPT,
            "--principal-dir",
            str(principal_root),
            "--blind-dir",
            str(self.temp_dir / "empty-blind"),
            "--json-out",
            str(out_json),
        )
        self.assertEqual(0, result.returncode, msg=result.stderr)

        payload = json.loads(out_json.read_text(encoding="utf-8"))
        self.assertEqual("INSUFFICIENT_EVIDENCE", payload["disposition"])

    def test_guard_warns_and_exits_zero_on_insufficient_sample(self) -> None:
        principal_root = self.temp_dir / "principal"
        self._write_principal_session(principal_root, "pa-1", "yes", n_count=2, x_count=0)

        out_json = self.temp_dir / "report.json"
        batch = _run(
            BATCH_SCRIPT,
            "--principal-dir",
            str(principal_root),
            "--blind-dir",
            str(self.temp_dir / "empty-blind"),
            "--json-out",
            str(out_json),
        )
        self.assertEqual(0, batch.returncode, msg=batch.stderr)

        guard = _run(GUARD_SCRIPT, "--report-json", str(out_json))
        self.assertEqual(0, guard.returncode, msg=guard.stdout)
        self.assertIn("insufficient evidence", guard.stderr.lower())


if __name__ == "__main__":
    unittest.main()
