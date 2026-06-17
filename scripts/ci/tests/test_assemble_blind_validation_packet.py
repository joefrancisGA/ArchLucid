"""Tests for assemble_blind_validation_packet.py."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "assemble_blind_validation_packet.py"
FIXTURE = REPO_ROOT / "fixtures" / "blind-validation" / "regulated-scenario"


def _run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class AssembleBlindValidationPacketTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="blind-validation-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_assemble_writes_expected_artifacts(self) -> None:
        output = self.temp_dir / "packet"
        result = _run(
            "assemble",
            "--fixture",
            str(FIXTURE),
            "--output",
            str(output),
            "--seed",
            "42",
            "--session-id",
            "test-session",
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertTrue((output / "reviewer-packet.md").is_file())
        self.assertTrue((output / "blind-packet.json").is_file())
        self.assertTrue((output / "scoring-sheet.json").is_file())
        self.assertTrue((output / "source-key.json").is_file())
        self.assertTrue((output / "exec-summary.template.md").is_file())

        packet = json.loads((output / "blind-packet.json").read_text(encoding="utf-8"))
        scoring = json.loads((output / "scoring-sheet.json").read_text(encoding="utf-8"))

        self.assertEqual(packet.get("schema"), "archlucid.blind-validation-packet.v1")
        self.assertEqual(scoring.get("sessionId"), "test-session")
        self.assertEqual(len(packet.get("blindArms") or []), 2)

        rating = scoring["ratings"][0]
        self.assertIn("novelty", rating)
        self.assertIn("correctnessConfidence", rating)
        self.assertIn("actionability", rating)
        self.assertIn("surpriseFactor", rating)
        self.assertIn("decisionImpact", rating)

    def test_summarize_produces_session_summary(self) -> None:
        output = self.temp_dir / "packet"
        assemble = _run("assemble", "--fixture", str(FIXTURE), "--output", str(output), "--seed", "7")
        self.assertEqual(assemble.returncode, 0, msg=assemble.stderr)

        scoring_path = output / "scoring-sheet.json"
        scoring = json.loads(scoring_path.read_text(encoding="utf-8"))
        scoring["ratings"][0]["novelty"] = 4
        scoring["ratings"][0]["correctnessConfidence"] = 5
        scoring["ratings"][0]["actionability"] = 4
        scoring["ratings"][0]["surpriseFactor"] = 3
        scoring["ratings"][0]["decisionImpact"] = 4
        scoring["ratings"][0]["classification"] = "U"
        scoring["sessionMetadata"]["reuseIntent"] = "maybe"
        scoring_path.write_text(json.dumps(scoring, indent=2) + "\n", encoding="utf-8")

        summary_dir = self.temp_dir / "summary"
        result = _run(
            "summarize",
            "--scoring-sheet",
            str(scoring_path),
            "--packet",
            str(output / "blind-packet.json"),
            "--output",
            str(summary_dir),
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertTrue((summary_dir / "session-summary.json").is_file())
        self.assertTrue((summary_dir / "session-summary.md").is_file())

        summary = json.loads((summary_dir / "session-summary.json").read_text(encoding="utf-8"))
        self.assertEqual(summary.get("schema"), "archlucid.blind-insight-validation-summary.v1")
        self.assertEqual(summary.get("reuseIntent"), "maybe")
        self.assertTrue(summary.get("armSummaries"))

    def test_score_non_interactive_updates_sheet_and_summarizes(self) -> None:
        output = self.temp_dir / "packet"
        assemble = _run("assemble", "--fixture", str(FIXTURE), "--output", str(output), "--seed", "99")
        self.assertEqual(assemble.returncode, 0, msg=assemble.stderr)

        result = _run(
            "score",
            "--packet-dir",
            str(output),
            "--non-interactive",
            "--fill-rating",
            "4",
            "--fill-classification",
            "U",
            "--auto-summarize",
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr)

        scoring = json.loads((output / "scoring-sheet.json").read_text(encoding="utf-8"))
        first = scoring["ratings"][0]
        self.assertEqual(first["novelty"], 4)
        self.assertEqual(first["classification"], "U")
        self.assertTrue((output / "session-summary.json").is_file())


if __name__ == "__main__":
    unittest.main()
