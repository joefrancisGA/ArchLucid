import json
import unittest
from datetime import datetime, timezone
from scripts.ci.report_pricing_quote_cohort_safety import build

ASOF = datetime(2026, 10, 28, tzinfo=timezone.utc)

def record(id, email, company, created="2026-10-25T00:00:00Z", status="Open"):
    return {"id": id, "createdUtc": created, "workEmail": email,
            "companyName": company, "status": status, "tierInterest": "Team"}

class QuoteCohortSafetyTests(unittest.TestCase):
    def test_deduplicated_aggregate_no_names_emails_or_ids(self):
        payload = {"schema": "archlucid.pricing-quote-requests-export.v1",
                   "rows": [record("1", "A@EXAMPLE.TEST", "Example Inc"),
                            record("2", "a@example.test", "EXAMPLE INC"),
                            record("3", "b@example.test", "Other", status="Closed")]}
        report = build(payload, as_of=ASOF)
        self.assertEqual(1, report["potentialDuplicateGroups"])
        self.assertEqual(1, report["duplicateRecordExcess"])
        self.assertEqual(2, report["unansweredByAge"]["72h_plus"])
        self.assertEqual(1, report["closedCount"])
        serialized = json.dumps(report)
        for secret in ("example.test", "Example Inc", '"1"'):
            self.assertNotIn(secret, serialized)

    def test_schema_and_future_timestamps_fail_closed(self):
        with self.assertRaises(ValueError):
            build({"schema": "wrong", "rows": []}, as_of=ASOF)
        with self.assertRaises(ValueError):
            build({"schema": "archlucid.pricing-quote-requests-export.v1",
                   "rows": [record("1", "a@example.test", "Example",
                                   created="2027-01-01T00:00:00Z")]}, as_of=ASOF)

    def test_no_leads_never_produces_conversion_claim(self):
        report = build({"schema": "archlucid.pricing-quote-requests-export.v1",
                        "rows": []}, as_of=ASOF)
        self.assertEqual("NO_RECORDS", report["status"])
        self.assertEqual("INSUFFICIENT_EVIDENCE", report["disposition"])

if __name__=="__main__":
    unittest.main()
