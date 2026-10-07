"""Tests for private-beta spend-freeze snapshot validation."""

from __future__ import annotations

import unittest

import sys
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import check_private_beta_spend_freeze as sut


class TestPrivateBetaSpendFreeze(unittest.TestCase):
    def test_accepts_complete_simulator_snapshot(self) -> None:
        snapshot = {
            "api": {"executionMode": "Simulator"},
            "worker": {"executionMode": "Simulator"},
            "anonymousExecutionEnabled": False,
            "controlledResponse": {"mode": "Simulator", "correlationId": "corr-1"},
        }

        self.assertEqual(sut.validate_snapshot(snapshot), [])

    def test_rejects_real_or_unobservable_snapshot(self) -> None:
        snapshot = {
            "api": {"executionMode": "Real"},
            "worker": {"executionMode": "Simulator"},
            "anonymousExecutionEnabled": True,
            "controlledResponse": {"mode": "Real"},
        }

        issues = sut.validate_snapshot(snapshot)

        self.assertEqual(len(issues), 4)


if __name__ == "__main__":
    unittest.main()
