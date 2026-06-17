"""Tests for generic-AI bakeoff summary generator."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
_CI_DIR = REPO_ROOT / "scripts" / "ci"
sys.path.insert(0, str(_CI_DIR))

from build_generic_ai_bakeoff_summary import build_summary, render_markdown  # noqa: E402


class BuildGenericAiBakeoffSummaryTests(unittest.TestCase):
    def test_fixture_summary_includes_dimensions_and_anti_claims(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet_dir = root / "packet"
            packet_dir.mkdir()
            (packet_dir / "packet-metadata.json").write_text(
                json.dumps({"runId": "run-fixture", "executionMode": "Real"}),
                encoding="utf-8",
            )
            manual_path = root / "manual-findings.md"
            manual_path.write_text(
                "# Manual findings\n\n- Risk: single-region dependency\n",
                encoding="utf-8",
            )

            payload = build_summary(
                archlucid_packet_dir=packet_dir,
                manual_ai_path=manual_path,
                archlucid_minutes=42,
                manual_minutes=None,
                session_notes="Manual timing not recorded.",
            )

            self.assertEqual(payload["schema"], "archlucid.generic-ai-bakeoff-summary.v1")
            self.assertEqual(len(payload["dimensions"]), 6)
            self.assertIn("Do not claim ArchLucid is smarter than frontier AI", payload["antiClaims"])
            self.assertIsNone(payload["inputs"]["manualTimingMinutes"])

            markdown = render_markdown(payload)
            self.assertIn("Where manual frontier AI wins", markdown)
            self.assertIn("unknown / not measured", markdown)


if __name__ == "__main__":
    unittest.main()
