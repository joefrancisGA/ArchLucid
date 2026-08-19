"""Tests for buyer-surface change detection."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load(module_name: str, script_name: str):
    script = _CI / script_name
    spec = importlib.util.spec_from_file_location(module_name, script)

    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script_name}")

    sys.path.insert(0, str(_CI))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    return mod


DETECT = _load("detect_buyer_surface_changes", "detect_buyer_surface_changes.py")


class DetectBuyerSurfaceChangesTests(unittest.TestCase):
    def test_path_matches_buyer_surface_prefix(self) -> None:
        self.assertTrue(DETECT.path_matches_buyer_surface("docs/go-to-market/trust-center.md"))
        self.assertTrue(DETECT.path_matches_buyer_surface("archlucid-ui/src/app/(marketing)/pricing/page.tsx"))
        self.assertFalse(DETECT.path_matches_buyer_surface("ArchLucid.Api/Controllers/HealthController.cs"))

    def test_detect_changed_surfaces_from_explicit_paths(self) -> None:
        payload = {
            "buyerSurfaceChanged": True,
            "changedPaths": ["docs/go-to-market/PRICING_PHILOSOPHY.md"],
        }

        self.assertTrue(payload["buyerSurfaceChanged"])
        self.assertEqual(len(payload["changedPaths"]), 1)


if __name__ == "__main__":
    unittest.main()
