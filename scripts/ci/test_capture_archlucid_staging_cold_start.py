import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from scripts.ci.capture_archlucid_staging_cold_start import (
    capture, parse_utc, safe_https_base, skipped,
)

SHA = "a" * 40
CREATED = "2026-10-28T10:00:00Z"
REV = {"name": "archlucid-api--r123", "properties": {"createdTime": CREATED}}


class StagingColdStartEvidenceTests(unittest.TestCase):
    def test_healthy_probe_auth_and_version_are_separate(self):
        calls = []
        def fake_get(url, api_key=None, timeout=10):
            calls.append((url.split("/")[-1], api_key is not None))
            if url.endswith("/ready"):
                return 200, {"status": "Healthy"}
            if url.endswith("/me"):
                return 200, {"name": "principal"}
            return 200, {"commitSha": SHA}

        def fake_now():
            return datetime(2026, 10, 28, 10, 0, 15, tzinfo=timezone.utc)

        report = capture(expected_sha=SHA, revision_name=REV["name"],
                         update_start_utc=CREATED, revision=REV,
                         base_url="https://staging.example.test", api_key="secret",
                         get=fake_get, now=fake_now)
        self.assertEqual("OBSERVED_NOT_PROVEN_FRESH_REVISION", report["status"])
        self.assertEqual(15, report["readiness"]["revisionToFirstObservedHealthySeconds"])
        self.assertEqual(3, report["firstAuthenticatedBusinessRead"]["sampleCount"])
        self.assertEqual([("ready", False), ("me", True), ("me", True), ("me", True),
                          ("version", False)], calls)
        self.assertNotIn("secret", json.dumps(report))

    def test_revision_mismatch_never_probes(self):
        def fail_get(*args, **kwargs):
            self.fail("No network allowed on revision mismatch")
        report = capture(expected_sha=SHA, revision_name="wrong", update_start_utc=CREATED,
                         revision=REV, base_url="https://staging.example.test",
                         api_key="secret", get=fail_get)
        self.assertEqual("INCONCLUSIVE", report["status"])
        self.assertEqual("AZURE_REVISION_IDENTITY_MISMATCH", report["reason"])

    def test_version_mismatch_never_claims_measured_deploy(self):
        def fake_get(url, api_key=None, timeout=10):
            if url.endswith("/ready"):
                return 200, {"status": "Healthy"}
            if url.endswith("/me"):
                return 200, {}
            return 200, {"commitSha": "b" * 40}
        report = capture(expected_sha=SHA, revision_name=REV["name"],
                         update_start_utc=CREATED, revision=REV,
                         base_url="https://staging.example.test", api_key="secret",
                         get=fake_get)
        self.assertEqual("INCONCLUSIVE", report["status"])
        self.assertEqual("VERSION_MISMATCH_OR_UNAVAILABLE", report["reason"])

    def test_missing_created_timestamp_never_invents_revision_to_ready(self):
        def fake_get(url, api_key=None, timeout=10):
            if url.endswith("/ready"):
                return 200, {"status": "Healthy"}
            if url.endswith("/me"):
                return 200, {}
            return 200, {"commitSha": SHA}
        report = capture(expected_sha=SHA, revision_name=REV["name"],
                         update_start_utc=CREATED, revision={"name": REV["name"]},
                         base_url="https://staging.example.test", api_key="secret",
                         get=fake_get)
        self.assertIsNone(report["readiness"]["revisionToFirstObservedHealthySeconds"])
        self.assertEqual("INCONCLUSIVE", report["status"])

    def test_missing_credential_and_skipped_workflow_are_not_measured(self):
        report = capture(expected_sha=SHA, revision_name=REV["name"],
                         update_start_utc=CREATED, revision=REV,
                         base_url="https://staging.example.test", api_key=None)
        self.assertEqual("INCONCLUSIVE", report["status"])
        self.assertEqual("NOT_MEASURED", report["firstAuthenticatedBusinessRead"]["status"])
        self.assertEqual("NOT_DEPLOYED", skipped(reason="AUTO_DEPLOY_DISABLED")["status"])

    def test_rejects_insecure_url_and_naive_time(self):
        for url in ("http://example.com", "https://alice:secret@example.com",
                    "https://example.com/some/path", "https://example.com/#fragment"):
            with self.assertRaises(ValueError):
                safe_https_base(url)
        self.assertIsNone(parse_utc("2026-10-28T10:00:00"))
        self.assertIsNone(parse_utc("not a timestamp"))

    def test_nonhealthy_readiness_fails_with_no_business_probe(self):
        seen = []
        def fake_get(url, api_key=None, timeout=10):
            seen.append(url)
            return 503, {"status": "Unhealthy"}
        report = capture(expected_sha=SHA, revision_name=REV["name"],
                         update_start_utc=CREATED, revision=REV,
                         base_url="https://staging.example.test", api_key="secret",
                         get=fake_get, attempts=1)
        self.assertEqual("READINESS_NOT_OBSERVED", report["reason"])
        self.assertEqual(1, len(seen))


if __name__ == "__main__":
    unittest.main()
