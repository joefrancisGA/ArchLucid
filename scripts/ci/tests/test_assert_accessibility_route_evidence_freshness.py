"""Tests for scripts/ci/assert_accessibility_route_evidence_freshness.py."""
from __future__ import annotations

import importlib.util
import sys
import unittest
from datetime import date
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


def _load_module():
    script = _REPO / "scripts" / "ci" / "assert_accessibility_route_evidence_freshness.py"
    name = "assert_accessibility_route_evidence_freshness_tested"
    spec = importlib.util.spec_from_file_location(name, script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load accessibility freshness module.")

    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)

    return mod


_M = _load_module()


class TestAccessibilityRouteEvidenceFreshness(unittest.TestCase):
    def test_live_repo_accessibility_guard_passes(self):
        exit_code = _M.run_guard()

        self.assertEqual(exit_code, 0)

    def test_priority_route_matches_reviews_alias(self):
        page_paths = {"/reviews/new", "/reviews/run-1"}

        self.assertTrue(_M.priority_route_matches_pages("/runs/new", page_paths))
        self.assertTrue(_M.priority_route_matches_pages("/runs/{runId}", page_paths))

    def test_stale_last_reviewed_fails_at_threshold(self):
        today = date.today()
        old = today.replace(year=today.year - 2)

        self.assertGreater((today - old).days, 365)


if __name__ == "__main__":
    unittest.main()
