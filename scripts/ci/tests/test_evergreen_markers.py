"""Unit tests for evergreen.markers."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen import markers  # noqa: E402


class TestMarkers(unittest.TestCase):
    def test_carries_matches_whole_value_only(self) -> None:
        self.assertTrue(markers.carries("x\nEvergreen-Fingerprint: abc123\ny", markers.FINGERPRINT_MARKER, "abc123"))
        self.assertTrue(markers.carries("Evergreen-Fingerprint:abc123", markers.FINGERPRINT_MARKER, "abc123"))
        self.assertFalse(markers.carries("Evergreen-Fingerprint: abc123zz", markers.FINGERPRINT_MARKER, "abc123"))
        self.assertFalse(markers.carries("Evergreen-Family: abc123", markers.FINGERPRINT_MARKER, "abc123"))

    def test_carries_tolerates_missing_text(self) -> None:
        self.assertFalse(markers.carries(None, markers.FAMILY_MARKER, "x"))
        self.assertFalse(markers.carries("", markers.FAMILY_MARKER, "x"))

    def test_render_emits_both_markers(self) -> None:
        self.assertEqual(markers.render("fp", "fam"), "Evergreen-Fingerprint: fp\nEvergreen-Family: fam")


if __name__ == "__main__":
    unittest.main()
