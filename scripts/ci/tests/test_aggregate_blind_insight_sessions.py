"""Tests for aggregate_blind_insight_sessions.py."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "aggregate_blind_insight_sessions.py"
ASSEMBLE = REPO_ROOT / "scripts" / "assemble_blind_validation_packet.py"
FIXTURE = REPO_ROOT / "fixtures" / "blind-validation" / "regulated-scenario"


def _run(script: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(script), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class AggregateBlindInsightSessionsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="blind-cohort-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_aggregate_two_sessions(self) -> None:
        sessions_root = self.temp_dir / "sessions"

        for session_id, seed in (("session-a", "11"), ("session-b", "22")):
            output = sessions_root / session_id
            assemble = _run(
                ASSEMBLE,
                "assemble",
                "--fixture",
                str(FIXTURE),
                "--output",
                str(output),
                "--seed",
                seed,
                "--session-id",
                session_id,
            )
            self.assertEqual(0, assemble.returncode, msg=assemble.stderr)

            scoring_path = output / "scoring-sheet.json"
            scoring = json.loads(scoring_path.read_text(encoding="utf-8"))
            scoring["ratings"][0]["novelty"] = 4
            scoring["ratings"][0]["correctnessConfidence"] = 5
            scoring["ratings"][0]["actionability"] = 4
            scoring["ratings"][0]["surpriseFactor"] = 3
            scoring["ratings"][0]["decisionImpact"] = 4
            scoring["ratings"][0]["classification"] = "N"
            scoring["sessionMetadata"]["reuseIntent"] = "maybe"
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

        out_json = self.temp_dir / "cohort-summary.json"
        result = _run(
            SCRIPT,
            "--sessions-dir",
            str(sessions_root),
            "--json-out",
            str(out_json),
            "--markdown-out",
            str(self.temp_dir / "cohort-summary.md"),
        )
        self.assertEqual(0, result.returncode, msg=result.stderr)

        payload = json.loads(out_json.read_text(encoding="utf-8"))
        self.assertEqual(2, payload["sessionCount"])
        self.assertFalse(payload["messagingReady"])
        self.assertGreaterEqual(len(payload["cohortArms"]), 1)


if __name__ == "__main__":
    unittest.main()
