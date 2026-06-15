#!/usr/bin/env python3
"""Tests for build_rc_evidence_index.py."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
_CI_DIR = REPO_ROOT / "scripts" / "ci"
sys.path.insert(0, str(_CI_DIR))

from build_rc_evidence_index import build_index  # noqa: E402


class BuildRcEvidenceIndexTests(unittest.TestCase):
    def test_missing_artifacts_are_not_run(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            bundle = Path(tmp)
            index = build_index(REPO_ROOT, bundle)
            self.assertEqual(index["rollup"], "PASS")
            not_run = [r for r in index["rows"] if r["verdict"] == "NOT_RUN"]
            self.assertGreater(len(not_run), 0)

    def test_hold_when_real_mode_claim_gate_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            bundle = Path(tmp)
            (bundle / "real-mode-claim-gate.json").write_text(
                json.dumps({"disposition": "HOLD", "claimWordingClass": "waived-not-verified"}),
                encoding="utf-8",
            )
            index = build_index(REPO_ROOT, bundle)
            self.assertEqual(index["rollup"], "HOLD")
            claim_row = next(r for r in index["rows"] if r["artifact"] == "real-mode-claim-gate.json")
            self.assertEqual(claim_row["verdict"], "HOLD")


if __name__ == "__main__":
    unittest.main()
