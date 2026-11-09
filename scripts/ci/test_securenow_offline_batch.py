"""python3 -m unittest discover -s scripts/ci -p test_securenow_offline_batch.py"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).resolve().parents[1] / "securenow" / "offline_batch.py"
SPEC = importlib.util.spec_from_file_location("securenow_offline_batch", SCRIPT)
assert SPEC and SPEC.loader
batch = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(batch)

SUB_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
SUB_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
RESOURCE = "/subscriptions/{}/resourceGroups/rg/providers/Microsoft.Web/sites/app"


class OfflineBatchTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.packages = self.root / "packages"
        self.packages.mkdir()
        self.out = self.root / "reports"
        self.expected = self.root / "expected.json"
        self.native_dll = self.root / "SecureNow.QuestionReplay.dll"
        self.native_dll.write_bytes(b"prebuilt-test-placeholder")
        self.questions = self.root / "questions"
        self.questions.mkdir()

    def package(self, sub):
        path = self.packages / (sub + ".zip")
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("manifest.json", json.dumps({
                "schemaVersion": 2,
                "scriptVersion": "2.0",
                "subscriptionId": sub,
                "collectionTimestamp": "2026-11-01T00:00:00Z",
                "scope": "/subscriptions/" + sub,
                "switchesUsed": [],
                "azModuleVersion": "test",
            }))
            archive.writestr("resources.json", json.dumps([{
                "resourceId": RESOURCE.format(sub),
                "resourceType": "Microsoft.Web/sites",
                "name": "app",
            }]))
        return path

    def save_question(self, sub):
        (self.questions / (sub + ".questions.json")).write_text(json.dumps([{
            "snapshotId": "synthetic-snapshot-1",
            "subscriptionId": sub,
            "source": "InventoryEvidence",
            "questionKey": "unknown-evidence@v1",
            "resourceId": RESOURCE.format(sub),
            "evidenceFingerprint": "fixture-fingerprint",
        }]))

    def expected_subs(self, *subs):
        self.expected.write_text(json.dumps(list(subs)))

    @staticmethod
    def successful_native(dll, package, output, timeout):
        assert dll.name == "SecureNow.QuestionReplay.dll"
        assert timeout > 0
        info = batch.evidence_lab.load_package(package)
        sub = info["subscriptionId"]
        question = {
            "source": "InventoryEvidence",
            "questionKey": "unknown-evidence@v1",
            "resourceSha256": hashlib.sha256(
                RESOURCE.format(sub).lower().encode("utf-8")).hexdigest(),
            "evidenceFingerprint": "fixture-fingerprint",
        }
        output.write_text(json.dumps({
            "schema": "securenow.offline-native-questions.v1",
            "status": "PARTIAL_QUESTION_REPLAY",
            "subscriptionId": sub,
            "packageSha256": info["packageSha256"],
            "resourceCount": 1,
            "questionCount": 1,
            "questions": [question],
        }))
        return "EXECUTED"

    def execute(self, native=None, questions=None, workers=2):
        return batch.execute(
            self.packages, self.native_dll, self.out, self.expected,
            self.questions if questions else None,
            None, workers, 10, native or self.successful_native,
        )

    def test_two_subscriptions_with_api_export_match_partial_inventory_slice(self):
        for sub in (SUB_A, SUB_B):
            self.package(sub)
            self.save_question(sub)
        self.expected_subs(SUB_A, SUB_B)
        report = self.execute(questions=True)
        self.assertEqual(report["status"], "PARTIAL_NATIVE_REPLAY_ONLY")
        self.assertEqual(report["nativeExecutionCount"], 2)
        self.assertTrue(all(
            item["inventoryQuestionParity"] == "MATCHED_PARTIAL_SLICE"
            for item in report["subscriptions"]))
        self.assertTrue(all(
            all(v == "NOT_EXECUTED" for v in item["engineStages"].values())
            for item in report["subscriptions"]))
        self.assertFalse(any(x["provenanceAuthenticated"]
                             for x in report["subscriptions"]))
        self.assertTrue((self.out / "reconciliation.json").exists())
        self.assertNotIn(RESOURCE.format(SUB_A), json.dumps(report))

    def test_missing_expected_subscription_keeps_hold(self):
        self.package(SUB_A)
        self.expected_subs(SUB_A, SUB_B)
        report = self.execute()
        self.assertEqual(report["missingExpectedSubscriptions"], [SUB_B])
        self.assertEqual(report["status"], "HOLD")

    def test_extra_subscription_keeps_hold(self):
        self.package(SUB_A)
        self.package(SUB_B)
        self.expected_subs(SUB_A)
        report = self.execute()
        self.assertEqual(report["unexpectedSubscriptions"], [SUB_B])
        self.assertEqual(report["status"], "HOLD")

    def test_no_questions_means_not_comparable_not_zero(self):
        self.package(SUB_A)
        self.expected_subs(SUB_A)
        report = self.execute()
        self.assertEqual(report["status"], "PARTIAL_NATIVE_REPLAY_ONLY")
        self.assertEqual(
            report["subscriptions"][0]["inventoryQuestionParity"], "NOT_COMPARABLE")
        self.assertEqual(
            report["subscriptions"][0]["questionQueueStatus"], "NotProvided")

    def test_failed_native_worker_keeps_hold(self):
        self.package(SUB_A)
        self.expected_subs(SUB_A)
        report = self.execute(native=lambda *_: "PROCESS_FAILED")
        self.assertEqual(report["nativeExecutionCount"], 0)
        self.assertEqual(report["subscriptions"][0]["nativeReplay"], "PROCESS_FAILED")
        self.assertEqual(report["status"], "HOLD")

    def test_bad_package_sha_rejected_without_favorable_conclusion(self):
        self.package(SUB_A)
        self.expected_subs(SUB_A)

        def bad_hash(dll, package, output, timeout):
            self.successful_native(dll, package, output, timeout)
            data = json.loads(output.read_text())
            data["packageSha256"] = "0" * 64
            output.write_text(json.dumps(data))
            return "EXECUTED"

        report = self.execute(native=bad_hash)
        self.assertEqual(report["status"], "HOLD")
        self.assertEqual(
            report["subscriptions"][0]["nativeReplay"], "INVALID_NATIVE_REPORT")

    def test_stale_report_cannot_be_reused_as_new_execution(self):
        self.package(SUB_A)
        self.expected_subs(SUB_A)
        native = self.out / "native"
        native.mkdir(parents=True)
        previous = native / (SUB_A + ".native.json")
        self.successful_native(
            self.native_dll, self.packages / (SUB_A + ".zip"), previous, 10
        )
        report = self.execute(native=lambda *_: "EXECUTED")
        self.assertEqual(report["status"], "HOLD")
        self.assertEqual(
            report["subscriptions"][0]["nativeReplay"], "INVALID_NATIVE_REPORT")

    def test_reject_workers_over_bound(self):
        self.package(SUB_A)
        self.expected_subs(SUB_A)
        with self.assertRaisesRegex(ValueError, "workers"):
            self.execute(workers=5)

    def test_reject_duplicate_expected_subscription(self):
        self.package(SUB_A)
        self.expected_subs(SUB_A, SUB_A)
        with self.assertRaisesRegex(ValueError, "unique"):
            self.execute()

    def test_worker_exception_fails_closed(self):
        self.package(SUB_A)
        self.expected_subs(SUB_A)

        def broken(*_):
            raise RuntimeError("simulated crash")

        report = self.execute(native=broken)
        self.assertEqual(report["status"], "HOLD")
        self.assertEqual(
            report["subscriptions"][0]["nativeReplay"], "WORKER_FAILED")


if __name__ == "__main__":
    unittest.main()
