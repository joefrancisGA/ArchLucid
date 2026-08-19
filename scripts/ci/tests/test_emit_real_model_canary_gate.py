"""Unit tests for emit_real_model_canary_gate.py (T1-4)."""

from __future__ import annotations

import os
import unittest
from unittest import mock

REPO_ROOT = __import__("pathlib").Path(__file__).resolve().parents[3]
CI = REPO_ROOT / "scripts" / "ci"

import sys

sys.path.insert(0, str(CI))

from emit_real_model_canary_gate import evaluate_gate, waiver_requested  # noqa: E402


class EmitRealModelCanaryGateTests(unittest.TestCase):
    def test_rc_strict_without_creds_is_waiver_required_fail(self) -> None:
        with mock.patch.dict(os.environ, {}, clear=True):
            payload = evaluate_gate(rc_strict=True)
            self.assertEqual(payload["disposition"], "WAIVER_REQUIRED_FAIL")
            self.assertEqual(payload["canaryResult"], "WAIVER_REQUIRED_FAIL")

    def test_non_rc_skips_without_creds(self) -> None:
        with mock.patch.dict(os.environ, {}, clear=True):
            payload = evaluate_gate(rc_strict=False)
            self.assertEqual(payload["disposition"], "SKIP")
            self.assertEqual(payload["canaryResult"], "SKIPPED_NO_CREDENTIALS")

    def test_owner_waiver_allows_skip_on_rc(self) -> None:
        env = {
            "ARCHLUCID_REAL_MODE_CANARY_WAIVER": "1",
            "ARCHLUCID_REAL_MODE_CANARY_WAIVER_OWNER": "release-owner",
            "ARCHLUCID_REAL_MODE_CANARY_WAIVER_RATIONALE": "simulator-only RC",
        }

        with mock.patch.dict(os.environ, env, clear=True):
            payload = evaluate_gate(rc_strict=True)
            self.assertEqual(payload["disposition"], "WAIVED")
            self.assertEqual(payload["canaryResult"], "WAIVED")
            self.assertEqual(payload["claimWordingClass"], "simulator-only")

    def test_rc_strict_without_creds_claim_wording_is_blocked_pending_waiver(self) -> None:
        with mock.patch.dict(os.environ, {}, clear=True):
            payload = evaluate_gate(rc_strict=True)
            self.assertEqual(payload["claimWordingClass"], "blocked-pending-waiver")
            self.assertIn("allowedClaimSummary", payload)

    def test_waiver_requested_parses_owner_fields(self) -> None:
        env = {
            "ARCHLUCID_REAL_MODE_CANARY_WAIVER": "true",
            "ARCHLUCID_REAL_MODE_CANARY_WAIVER_OWNER": "me",
            "ARCHLUCID_REAL_MODE_CANARY_WAIVER_RATIONALE": "budget hold",
        }

        with mock.patch.dict(os.environ, env, clear=True):
            requested, owner, rationale = waiver_requested()
            self.assertTrue(requested)
            self.assertEqual(owner, "me")
            self.assertEqual(rationale, "budget hold")


if __name__ == "__main__":
    unittest.main()
