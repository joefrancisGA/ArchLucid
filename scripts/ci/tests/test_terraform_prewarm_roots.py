"""Prewarm script must cover every terraform-validate-public-stacks matrix root (+ private)."""

from __future__ import annotations

import re
import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = REPO_ROOT / ".github/workflows/ci.yml"
WARM = REPO_ROOT / "scripts/ci/warm_terraform_provider_plugin_cache.sh"


class TestTerraformPrewarmRoots(unittest.TestCase):
    def test_warm_script_covers_public_matrix_roots(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        match = re.search(
            r"terraform-validate-public-stacks:[\s\S]*?directory:\s*\[(.*?)\]",
            workflow,
        )
        self.assertIsNotNone(match, "could not parse terraform-validate-public-stacks matrix")
        matrix = [
            part.strip().strip("'\"")
            for part in match.group(1).split(",")
            if part.strip()
        ]

        warm_text = WARM.read_text(encoding="utf-8")
        for root in matrix:
            self.assertRegex(warm_text, rf"(?m)^\s+{re.escape(root)}\s*$", msg=f"missing prewarm root {root}")

        self.assertIn('infra/terraform-private', warm_text)

    def test_init_script_is_executable(self) -> None:
        init_script = REPO_ROOT / "scripts/ci/terraform_init_registry_resilient.sh"
        completed = subprocess.run(
            ["bash", "-n", str(init_script)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(0, completed.returncode, completed.stderr)


if __name__ == "__main__":
    unittest.main()
