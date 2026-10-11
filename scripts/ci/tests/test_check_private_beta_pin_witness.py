"""Tests for the private-beta frozen-pin witness guard."""

from __future__ import annotations

import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from scripts.ci import check_private_beta_pin_witness as witness


class TestPrivateBetaPinWitness(unittest.TestCase):
    def test_failure_blocks_pin_advance(self) -> None:
        self.assertFalse(witness.pin_advance_allowed("failure"))

    def test_success_allows_pin_advance(self) -> None:
        self.assertTrue(witness.pin_advance_allowed("success"))

    def test_missing_conclusion_is_not_authorized(self) -> None:
        self.assertTrue(witness.pin_advance_allowed(None))

    def test_missing_conclusion_prints_notice(self) -> None:
        output = io.StringIO()

        with patch("sys.argv", ["check_private_beta_pin_witness.py"]), redirect_stdout(output):
            self.assertEqual(witness.main(), 0)

        self.assertIn("frozen-pin advance was not authorized", output.getvalue())

    def test_failure_conclusion_returns_error(self) -> None:
        output = io.StringIO()

        with patch("sys.argv", ["check_private_beta_pin_witness.py", "--conclusion", "failure"]), redirect_stdout(output):
            self.assertEqual(witness.main(), 1)

        self.assertIn("requires a successful JwtBearer witness", output.getvalue())


if __name__ == "__main__":
    unittest.main()
