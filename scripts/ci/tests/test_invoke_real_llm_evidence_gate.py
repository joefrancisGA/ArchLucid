"""Verify Invoke-RealLlmEvidenceGate.ps1 without AOAI credentials writes an honest Markdown report and exits 0."""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


class TestInvokeRealLlmEvidenceGate(unittest.TestCase):
    def test_without_credentials_exits_zero_and_does_not_claim_live_validation(self):
        pwsh = shutil.which("pwsh")
        if pwsh is None:
            self.skipTest("pwsh not on PATH")

        script = _REPO / "scripts" / "Invoke-RealLlmEvidenceGate.ps1"
        self.assertTrue(script.is_file(), script)

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "gate.md"
            env = os.environ.copy()
            env["ARCHLUCID_SKIP_LOCAL_REAL_AOAI_ENV"] = "1"
            for k in list(env.keys()):
                if k.startswith("ARCHLUCID_REAL_AOAI") or k == "ARCHLUCID_REAL_LLM_RUN_METRICS_JSON":
                    del env[k]

            result = subprocess.run(
                [
                    pwsh,
                    "-NoProfile",
                    "-NonInteractive",
                    "-File",
                    str(script),
                    "-MarkdownOut",
                    str(out.resolve()),
                ],
                cwd=_REPO,
                env=env,
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            text = out.read_text(encoding="utf-8")
            self.assertIn("| Credentials present | **Skipped**", text)
            self.assertIn("| Topology smoke run executed | **Skipped**", text)
            self.assertIn("| Full pipeline run executed | **Skipped**", text)
            self.assertIn("| Semantic score | **Skipped**", text)
            self.assertIn("SKIPPED_NO_CREDENTIALS", text)
            self.assertIn(
                "Do not cite this gate as live validation unless disposition is `PASS`",
                text,
            )
