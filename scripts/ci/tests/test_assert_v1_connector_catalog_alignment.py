"""Smoke tests for V1 connector catalog ↔ scope alignment."""
from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


class TestAssertV1ConnectorCatalogAlignment(unittest.TestCase):
    def test_catalog_alignment_repo_passes(self):
        script = _REPO / "scripts/ci/assert_v1_connector_catalog_alignment.py"
        result = subprocess.run([sys.executable, str(script)], cwd=_REPO, check=False, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
