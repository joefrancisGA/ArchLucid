"""Tests for aggregate_principal_architect_sessions.py."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "aggregate_principal_architect_sessions.py"
TEMPLATE = REPO_ROOT / "docs" / "go-to-market" / "templates" / "principal-architect-session.template.json"


def _run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class AggregatePrincipalArchitectSessionsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="principal-arch-cohort-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _write_session(self, folder: Path, session_id: str, reuse_intent: str, arch_n: int, ai_n: int) -> None:
        payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        payload["sessionId"] = session_id
        payload["sessionUtc"] = "2026-06-15T20:00:00Z"
        payload["reuseIntent"] = reuse_intent
        payload["sourceCounts"]["archlucid"].update({"N": arch_n, "O": 1, "U": 1, "X": 0, "S": 0})
        payload["sourceCounts"]["manualFrontierAi"].update({"N": ai_n, "O": 2, "U": 1, "X": 0, "S": 0})
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "session.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    def test_aggregates_sessions_and_emits_markdown(self) -> None:
        sessions_root = self.temp_dir / "sessions"
        self._write_session(sessions_root / "s1", "s1", "yes", arch_n=4, ai_n=1)
        self._write_session(sessions_root / "s2", "s2", "maybe", arch_n=3, ai_n=1)
        self._write_session(sessions_root / "s3", "s3", "no", arch_n=2, ai_n=1)

        out_json = self.temp_dir / "cohort.json"
        out_md = self.temp_dir / "cohort.md"
        result = _run("--sessions-dir", str(sessions_root), "--json-out", str(out_json), "--markdown-out", str(out_md))
        self.assertEqual(0, result.returncode, msg=result.stderr)

        payload = json.loads(out_json.read_text(encoding="utf-8"))
        self.assertEqual("archlucid.principal-architect-cohort-summary.v1", payload["schema"])
        self.assertEqual(3, payload["sessionCount"])
        self.assertTrue(payload["messagingReady"])
        self.assertIn("archlucid", payload)
        self.assertIn("manualFrontierAi", payload)
        self.assertTrue(out_md.is_file())


if __name__ == "__main__":
    unittest.main()
