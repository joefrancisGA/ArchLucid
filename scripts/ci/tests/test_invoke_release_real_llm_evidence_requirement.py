"""Invoke-ReleaseRealLlmEvidenceRequirement.ps1 skips when env unset; documents requirement when set."""

from __future__ import annotations

import os
import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "Invoke-ReleaseRealLlmEvidenceRequirement.ps1"


class TestInvokeReleaseRealLlmEvidenceRequirement(unittest.TestCase):
    def test_skips_when_env_unset(self) -> None:
        env = os.environ.copy()
        env.pop("ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE", None)
        out = REPO_ROOT / "artifacts" / "release" / "test-real-llm-release-requirement-skip.md"
        result = subprocess.run(
            [
                "pwsh",
                "-NoProfile",
                "-File",
                str(SCRIPT),
                "-MarkdownOut",
                str(out),
            ],
            cwd=REPO_ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)
        self.assertTrue(out.is_file())
        text = out.read_text(encoding="utf-8")
        self.assertIn("skipped", text.lower())


if __name__ == "__main__":
    unittest.main()
