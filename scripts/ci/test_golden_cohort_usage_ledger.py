"""Tests for golden_cohort_budget_probe.py --usage-ledger (local JSON append, no Azure)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class TestGoldenCohortUsageLedger(unittest.TestCase):
    def test_usage_ledger_appends_entry(self) -> None:
        repo = Path(__file__).resolve().parents[2]
        env = os.environ.copy()
        env["ARCHLUCID_GOLDEN_COHORT_BUDGET_PROBE_SIMULATE_MTD_USD"] = "12.34"

        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / "usage-mtd.json"
            proc = subprocess.run(
                [
                    sys.executable,
                    str(repo / "scripts" / "golden_cohort_budget_probe.py"),
                    "--usage-ledger",
                    str(ledger),
                ],
                cwd=repo,
                capture_output=True,
                text=True,
                check=False,
                env=env,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)

            with ledger.open(encoding="utf-8") as handle:
                data = json.load(handle)

            self.assertEqual(data.get("schemaVersion"), 1)
            entries = data.get("entries")
            self.assertIsInstance(entries, list)
            assert isinstance(entries, list)
            self.assertEqual(len(entries), 1)
            self.assertEqual(entries[0].get("source"), "simulate")
            self.assertAlmostEqual(float(entries[0].get("mtdUsd", 0)), 12.34)


if __name__ == "__main__":
    unittest.main()
