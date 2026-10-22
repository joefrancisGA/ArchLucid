"""Unit tests for evergreen.lane."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.lane import Lane, parse_lanes  # noqa: E402


class TestParseLanes(unittest.TestCase):
    def test_blank_means_no_lanes(self) -> None:
        self.assertEqual(parse_lanes(""), frozenset())
        self.assertEqual(parse_lanes(" , "), frozenset())

    def test_parses_comma_list_case_insensitively(self) -> None:
        self.assertEqual(parse_lanes("Dependabot, scheduled"), frozenset({Lane.DEPENDABOT, Lane.SCHEDULED}))

    def test_unknown_lane_is_rejected_with_the_valid_names(self) -> None:
        with self.assertRaisesRegex(ValueError, r"unknown lane\(s\) \['nope'\].*dependabot"):
            parse_lanes("dependabot,nope")


if __name__ == "__main__":
    unittest.main()
