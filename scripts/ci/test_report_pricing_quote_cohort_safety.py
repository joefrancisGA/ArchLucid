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

    def test_future_first_response_does_not_hide_aging(self):
        lead = record("1", "buyer@example.test", "Example")
        lead["firstResponseUtc"] = "2026-10-29T00:00:00Z"
        with self.assertRaisesRegex(ValueError, "outside snapshot window"):
            build({"schema": "archlucid.pricing-quote-requests-export.v1",
                   "rows": [lead]}, as_of=ASOF)

    def test_backdated_response_and_closure_are_rejected(self):
        for field in ("firstResponseUtc", "closedUtc"):
            with self.subTest(field=field):
                lead = record("1", "buyer@example.test", "Example")
                lead[field] = "2026-10-24T23:59:59Z"
                with self.assertRaisesRegex(ValueError, "outside snapshot window"):
                    build({"schema": "archlucid.pricing-quote-requests-export.v1",
                           "rows": [lead]}, as_of=ASOF)

    def test_repeated_export_id_is_not_a_second_lead(self):
        with self.assertRaisesRegex(ValueError, "Duplicate quote request ID"):
            build({"schema": "archlucid.pricing-quote-requests-export.v1",
                   "rows": [record("Request-A", "a@example.test", "Example"),
                            record("request-a", "a@example.test", "Example")]},
                  as_of=ASOF)

    def test_malformed_rows_are_not_silently_dropped(self):
        with self.assertRaisesRegex(ValueError, "Invalid or oversized"):
            build({"schema": "archlucid.pricing-quote-requests-export.v1",
                   "rows": [record("1", "a@example.test", "Example"), None]},
                  as_of=ASOF)

    def test_invalid_customer_supplied_timestamp_is_not_echoed(self):
        secret = "private-person@example.test"
        lead = record("1", "buyer@example.test", "Example", created=secret)
        with self.assertRaises(ValueError) as caught:
            build({"schema": "archlucid.pricing-quote-requests-export.v1",
                   "rows": [lead]}, as_of=ASOF)
        self.assertEqual("Invalid quote export record", str(caught.exception))
        self.assertNotIn(secret, str(caught.exception))

    def test_valid_historical_response_and_distinct_id_duplicates_still_work(self):
        first = record("1", "buyer@example.test", "Example")
        first["firstResponseUtc"] = "2026-10-25T12:00:00Z"
        second = record("2", "BUYER@example.test", "example")
        report = build({"schema": "archlucid.pricing-quote-requests-export.v1",
                        "rows": [first, second]}, as_of=ASOF)
        self.assertEqual(2, report["recordCount"])
        self.assertEqual(1, report["potentialDuplicateGroups"])
        self.assertEqual(1, report["unansweredByAge"]["72h_plus"])

    def test_no_leads_never_produces_conversion_claim(self):
        report = build({"schema": "archlucid.pricing-quote-requests-export.v1",
                        "rows": []}, as_of=ASOF)
        self.assertEqual("NO_RECORDS", report["status"])
        self.assertEqual("INSUFFICIENT_EVIDENCE", report["disposition"])

if __name__=="__main__":
    unittest.main()
