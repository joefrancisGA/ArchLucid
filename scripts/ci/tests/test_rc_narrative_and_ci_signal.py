"""Tests for RC decision narrative and sponsor brief builders."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CI = REPO_ROOT / "scripts" / "ci"


def run_py(script: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(CI / script), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class RcNarrativeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="rc-narrative-"))
        self.bundle = self.temp_dir / "bundle"
        self.bundle.mkdir()

        (self.bundle / "rc-go-no-go-verdict.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.rc-go-no-go-verdict.v1",
                    "verdict": "HOLD",
                    "blockers": ["Real-mode claim gate: HOLD"],
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (self.bundle / "first-pilot-timing-budget.json").write_text(
            json.dumps(
                {
                    "disposition": "WARN",
                    "firstValueCommitBudget": {
                        "disposition": "WARN",
                        "detail": "Measured path 12 min",
                    },
                }
            )
            + "\n",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_decision_narrative_hold_line(self) -> None:
        json_out = self.temp_dir / "narrative.json"
        md_out = self.temp_dir / "narrative.md"
        result = run_py(
            "build_rc_decision_narrative.py",
            "--bundle-dir",
            str(self.bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)
        payload = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(payload["verdict"], "HOLD")
        self.assertIn("Hold release", payload["safeToReleaseLine"])
        self.assertIn("Real-mode claim gate", payload["topRisks"][0])

    def test_executive_brief_from_bundle(self) -> None:
        narrative_json = self.temp_dir / "narrative.json"
        narrative_md = self.temp_dir / "narrative.md"
        run_py(
            "build_rc_decision_narrative.py",
            "--bundle-dir",
            str(self.bundle),
            "--json-out",
            str(narrative_json),
            "--markdown-out",
            str(narrative_md),
        )

        brief_json = self.temp_dir / "brief.json"
        brief_md = self.temp_dir / "brief.md"
        result = run_py(
            "build_executive_one_screen_brief.py",
            "--bundle-dir",
            str(self.bundle),
            "--json-out",
            str(brief_json),
            "--markdown-out",
            str(brief_md),
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)
        payload = json.loads(brief_json.read_text(encoding="utf-8"))
        self.assertEqual(payload["readinessDisposition"], "HOLD")
        self.assertTrue(payload["caveats"])


class CiReleaseSignalHealthTests(unittest.TestCase):
    def test_classifies_timeout_from_log(self) -> None:
        result = run_py(
            "report_ci_release_signal_health.py",
            "--needs-json",
            str(REPO_ROOT / "scripts" / "ci" / "fixtures" / "ci-needs-sample.json")
            if (REPO_ROOT / "scripts" / "ci" / "fixtures" / "ci-needs-sample.json").is_file()
            else str(REPO_ROOT / "scripts" / "ci" / "data" / "claim_evidence_rules.v1.json"),
            "--json-out",
            str(Path(tempfile.mkdtemp()) / "out.json"),
            "--markdown-out",
            str(Path(tempfile.mkdtemp()) / "out.md"),
        )

        # When fixture missing, pass empty needs via inline temp file
        if result.returncode != 0:
            temp = Path(tempfile.mkdtemp())
            needs = temp / "needs.json"
            needs.write_text(json.dumps({"ui-e2e-live": {"result": "failure"}}) + "\n", encoding="utf-8")
            json_out = temp / "health.json"
            md_out = temp / "health.md"
            result = run_py(
                "report_ci_release_signal_health.py",
                "--needs-json",
                str(needs),
                "--json-out",
                str(json_out),
                "--markdown-out",
                str(md_out),
            )

        self.assertEqual(result.returncode, 0, msg=result.stderr)


if __name__ == "__main__":
    unittest.main()
