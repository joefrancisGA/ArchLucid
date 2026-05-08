"""Offline verification of scripts/Emit-ProductionProfilePreflightMarkdown.ps1 output."""
from __future__ import annotations

import subprocess
import tempfile
import unittest
import shutil
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


class TestProductionProfilePreflight(unittest.TestCase):
    def test_writes_markdown_sections_and_config_keys(self):
        pwsh = shutil.which("pwsh")
        if pwsh is None:
            self.skipTest("pwsh not on PATH")

        script = _REPO / "scripts" / "Emit-ProductionProfilePreflightMarkdown.ps1"
        self.assertTrue(script.is_file(), script)

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "preflight.md"

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
                check=False,
                capture_output=True,
                text=True,
                timeout=300,
            )

            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            text = out.read_text(encoding="utf-8")

            for title in (
                "## A) Repository and IaC readiness",
                "## B) API merged production profile",
                "## C) Worker configuration files",
                "## D) Repository reference",
                "## E) Deployed Azure resource verification",
                "ArchLucidAuth:Mode",
                "Authentication:ApiKey:Enabled",
                "LlmPromptRedaction:Enabled",
                "ConnectionStrings:ArchLucid",
                "Billing:Stripe",
                "Observability:Otlp:Enabled",
                "Billing:Stripe:SecretKey",
            ):
                self.assertIn(title, text)

            self.assertNotIn("sk_live_", text)


if __name__ == "__main__":
    unittest.main()
