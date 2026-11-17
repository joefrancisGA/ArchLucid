"""Stdlib tests: python3 -m unittest discover -s scripts/ci -p test_securenow_evidence_lab.py"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import warnings
import zipfile

LAB_FILE = Path(__file__).resolve().parents[1] / "securenow" / "evidence_lab.py"
spec = importlib.util.spec_from_file_location("securenow_evidence_lab", LAB_FILE)
assert spec and spec.loader
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)


class EvidenceLabTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.packages = self.root / "packages"
        self.packages.mkdir()
        self.questions = self.root / "questions"
        self.questions.mkdir()
        self.coverage = self.root / "coverage"
        self.coverage.mkdir()

    def package(self, subscription="sub-a", items=None, companions=None, duplicate=False):
        path = self.packages / f"{subscription}.zip"
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("manifest.json", json.dumps({
                "schemaVersion": 2,
                "subscriptionId": subscription,
                "collectionTimestamp": "2026-11-01T00:00:00Z",
                "scriptVersion": "v2",
            }))
            archive.writestr("resources.json", json.dumps(
                items if items is not None else [{
                    "resourceId": "/subscriptions/sub-a/resourceGroups/rg/providers/Microsoft.Web/sites/api",
                    "resourceType": "Microsoft.Web/sites",
                }]
            ))
            for name, value in (companions or {}).items():
                archive.writestr(name, json.dumps(value))
            if duplicate:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", UserWarning)
                    archive.writestr("resources.json", "[]")
        return path

    def test_two_subscriptions_and_missing_expected_is_not_clean(self):
        self.package("sub-a")
        self.package("sub-b", items=[])
        expected = self.root / "expected.json"
        expected.write_text('["sub-a","sub-b","sub-c"]')
        report = lab.run(sorted(self.packages.glob("*.zip")), None, None, expected, False)
        self.assertEqual(report["notCollectedSubscriptions"], ["sub-c"])
        self.assertIsNone(report["subscriptions"][0]["questionCount"])
        self.assertEqual(report["subscriptions"][1]["resourceCount"], 0)
        self.assertEqual(
            report["subscriptions"][0]["evidenceFileCoverage"]["role-assignments.json"],
            "NotCollectedOrNotPackaged",
        )

    def test_question_replay_never_answers_and_hashes_resource_id(self):
        self.package()
        resource_id = "/subscriptions/sub-a/resourceGroups/rg/providers/Microsoft.Web/sites/api"
        (self.questions / "sub-a.questions.json").write_text(json.dumps([{
            "subscriptionId": "sub-a",
            "questionKey": "unknown-evidence@v1",
            "source": "InventoryEvidence",
            "resourceId": resource_id,
            "evidenceFingerprint": "abc",
            "status": "Open",
        }]))
        report = lab.run(
            list(self.packages.glob("*.zip")), self.questions, None, None, False
        )
        question = report["subscriptions"][0]["questions"][0]
        self.assertTrue(question["resourcePresentInZip"])
        self.assertFalse(question["answerApplied"])
        self.assertEqual(question["classification"], "InsufficientRelationshipEvidence")
        self.assertNotIn(resource_id.lower(), json.dumps(report))
        self.assertTrue(question["resource"].startswith("sha256:"))

    def test_access_denial_only_when_explicitly_recorded(self):
        self.package()
        (self.questions / "sub-a.json").write_text(json.dumps([{
            "subscriptionId": "sub-a", "questionKey": "connection@v1",
            "source": "InferredConnection", "resourceId": "/missing",
        }]))
        (self.coverage / "sub-a.coverage.json").write_text(json.dumps({
            "subscriptionId": "sub-a",
            "sources": [{
                "source": "entra-group-memberships.json",
                "status": "AccessDenied",
                "detail": "403",
            }],
        }))
        report = lab.run(
            list(self.packages.glob("*.zip")),
            self.questions, self.coverage, None, False,
        )
        question = report["subscriptions"][0]["questions"][0]
        self.assertEqual(
            question["recordedAccessDeniedSources"],
            ["entra-group-memberships.json"],
        )
        self.assertEqual(
            question["classification"],
            "ApplicationEvidenceOrHumanConfirmationRequired",
        )

    def test_reject_cross_subscription_questions(self):
        self.package()
        (self.questions / "sub-a.json").write_text(
            json.dumps([{"subscriptionId": "sub-other"}])
        )
        with self.assertRaisesRegex(ValueError, "another subscription"):
            lab.run(
                list(self.packages.glob("*.zip")),
                self.questions, None, None, False,
            )

    def test_reject_duplicate_archive_members(self):
        path = self.package(duplicate=True)
        with self.assertRaisesRegex(ValueError, "Duplicate ZIP"):
            lab.load_package(path)

    def test_reject_unsafe_subscription_id(self):
        path = self.package()
        path.unlink()
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("manifest.json", json.dumps({
                "schemaVersion": 2,
                "subscriptionId": "../escape",
                "collectionTimestamp": "2026-11-01T00:00:00Z",
            }))
            archive.writestr("resources.json", "[]")
        with self.assertRaisesRegex(ValueError, "safe single-subscription"):
            lab.load_package(path)

    def test_deterministic_report(self):
        self.package()
        packages = list(self.packages.glob("*.zip"))
        self.assertEqual(
            lab.run(packages, None, None, None, False),
            lab.run(packages, None, None, None, False),
        )

    def test_command_writes_both_outputs(self):
        self.package()
        output = self.root / "output"
        self.assertEqual(
            lab.main(["--packages", str(self.packages), "--out", str(output)]),
            0,
        )
        self.assertTrue((output / "evidence-coverage.json").exists())
        self.assertIn(
            "Not a security clearance",
            (output / "evidence-coverage.md").read_text(),
        )


if __name__ == "__main__":
    unittest.main()
