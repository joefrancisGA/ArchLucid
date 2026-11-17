#!/usr/bin/env python3
"""Contract regression for k6 --summary-export fail-rate parsing (offline only)."""
import unittest

from assert_k6_ci_smoke_summary import _float, _metric_values


class K6SummaryExportRateTests(unittest.TestCase):
    def test_current_top_level_value_format(self):
        payload = {"metrics": {"http_req_failed": {
            "passes": 20, "fails": 12260,
            "value": 20 / 12280,
            "thresholds": {"rate<0.02": False},
        }}}
        rate = _float(_metric_values(payload, "http_req_failed"), "rate", "value")
        self.assertAlmostEqual(rate, 20 / 12280)
        self.assertLess(rate, 0.02)

    def test_legacy_nested_rate_format(self):
        payload = {"metrics": {"http_req_failed": {"values": {"rate": 0.12}}}}
        rate = _float(_metric_values(payload, "http_req_failed"), "rate", "value")
        self.assertEqual(rate, 0.12)
        self.assertGreater(rate, 0.02)

    def test_missing_rate_still_fails_closed(self):
        self.assertIsNone(_float(_metric_values({"metrics": {"http_req_failed": {
            "passes": 1, "fails": 9,
        }}}, "http_req_failed"), "rate", "value"))

    def test_malformed_rate_is_rejected(self):
        payload = {"metrics": {"http_req_failed": {"value": "NaN"}}}
        with self.assertRaises(ValueError):
            _float(_metric_values(payload, "http_req_failed"), "rate", "value")


if __name__ == "__main__":
    unittest.main()
