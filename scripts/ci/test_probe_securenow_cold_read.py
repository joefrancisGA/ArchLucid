import unittest
from unittest.mock import patch
from scripts.ci.probe_securenow_cold_read import collect, summarize, PATH

class ColdReadProbeTests(unittest.TestCase):
    def test_first_and_warm_are_separate(self):
        report = summarize([
            {"status":200,"milliseconds":350},
            {"status":200,"milliseconds":100},
            {"status":200,"milliseconds":150},
            {"status":200,"milliseconds":200}
        ])
        self.assertEqual("MEASURED", report["status"])
        self.assertEqual(350, report["firstRequestMs"])
        self.assertEqual(150, report["warmMedianMs"])
        self.assertEqual(3, report["warmSamples"])
        self.assertEqual(PATH, report["endpoint"])
    def test_failed_read_never_reports_measurement(self):
        self.assertEqual("INCONCLUSIVE", summarize([{"status":403,"milliseconds":20}])["status"])
        self.assertEqual("INCONCLUSIVE", summarize([])["status"])
    def test_invalid_or_insecure_configuration_never_sends_request(self):
        with self.assertRaises(ValueError):
            collect("http://example.test", "secret", 3)
        with self.assertRaises(ValueError):
            collect("https://example.test", "", 3)
        with self.assertRaises(ValueError):
            collect("https://example.test", "secret", 1)

if __name__ == "__main__":
    unittest.main()
