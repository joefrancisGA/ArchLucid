import unittest
from scripts.ops.export_archlucid_capacity_prometheus import interval_delta, collect

def fixture(values, labels=None):
    return {"status":"success","data":{"resultType":"matrix","result":[{"metric": labels or {}, "values":values}]}}

class PrometheusCapacityExportTests(unittest.TestCase):
    def test_counter_delta_from_aggregate(self):
        self.assertEqual(15, interval_delta(fixture([[100,"10"],[160,"25"]]), "archlucid_llm_prompt_tokens_total",100,160))
    def test_reject_reset(self):
        with self.assertRaises(ValueError):
            interval_delta(fixture([[100,"50"],[160,"2"]]), "archlucid_llm_prompt_tokens_total",100,160)
    def test_reject_series_labels(self):
        with self.assertRaises(ValueError):
            interval_delta(fixture([[100,"2"],[160,"5"]], {"tenant":"abc"}), "archlucid_llm_prompt_tokens_total",100,160)
    def test_reject_malformed_and_nan(self):
        with self.assertRaises(ValueError):
            interval_delta(fixture([[100,"2"],[160,"NaN"]]), "archlucid_llm_prompt_tokens_total",100,160)
    def test_reject_non_https_and_unallowlisted(self):
        with self.assertRaises(ValueError):
            collect("http://example.com", "", "archlucid_llm_prompt_tokens_total", 100, 160, 60)
        with self.assertRaises(ValueError):
            collect("https://example.com", "", "unapproved_metric", 100, 160, 60)
    def test_reject_large_window(self):
        with self.assertRaises(ValueError):
            collect("https://example.com", "", "archlucid_llm_prompt_tokens_total", 0, 90000, 60)

if __name__ == "__main__":
    unittest.main()
