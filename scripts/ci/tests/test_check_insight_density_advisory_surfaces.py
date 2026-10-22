"""Unit tests for check_insight_density_advisory_surfaces.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))

from check_insight_density_advisory_surfaces import (  # noqa: E402
    collect_required_marker_errors,
)


class TestCheckInsightDensityAdvisorySurfaces(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_insight_density_advisory_surfaces.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(
            result.returncode,
            0,
            msg=result.stdout + result.stderr,
        )

    def test_missing_typed_engine_scored_marker_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            rel_path = "docs/quality/insight-density-engine-distribution.md"
            path = root / rel_path
            path.parent.mkdir(parents=True)
            path.write_text(
                "claimBoundary: advisory measurement only.\n",
                encoding="utf-8",
            )

            errors = collect_required_marker_errors(
                root,
                markers=((rel_path, ("claimBoundary:", "typed-engine-scored")),),
            )

            self.assertTrue(
                any("typed-engine-scored" in error for error in errors),
                msg=errors,
            )


if __name__ == "__main__":
    unittest.main()
