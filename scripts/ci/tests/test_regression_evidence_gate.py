"""Defensive coverage for the scoped critical-defect evidence check."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
ASSURANCE = ROOT / "scripts" / "assurance"
sys.path.insert(0, str(ASSURANCE))
import regression_evidence_gate as gate  # noqa: E402


class CriticalEvidenceTests(TestCase):
    def setUp(self):
        self.root = Path(self.enterContext(TemporaryDirectory()))
        self.intake = self.root / gate.INTAKE
        self.intake.parent.mkdir(parents=True)
        self.count = 0

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root, text=True, stderr=subprocess.STDOUT).strip()

    def run_gate(self, rows, *, base=None):
        self.intake.write_bytes(gate.canonical_json({"schemaVersion": 1, "defects": rows}))
        self.count += 1
        output = self.root / f"result-{self.count}"
        args = ["--repo", str(self.root), "--output", str(output)]
        if base is not None:
            args.extend(("--base", base))
        result = subprocess.run([sys.executable, str(ASSURANCE / "regression_evidence_gate.py"), *args],
                                capture_output=True, check=False, timeout=15)
        self.assertEqual(result.stderr, b"")
        payload = json.loads((output / "summary.json").read_bytes())
        self.assertEqual(json.loads(result.stdout), payload)
        return result.returncode, payload

    def make_row(self, **kw):
        return {"defectId": "TEST-1", "confirmed": True, "severity": "critical",
                "regressionDisposition": "regression-test"} | kw

    def exception(self):
        return self.make_row(regressionDisposition="documented-nonautomatable", owner="team",
                             approvedBy="reviewer", reason="provider event cannot be induced",
                             revisitCondition="revisit when replay endpoint is available")

    def test_empty_or_unconfirmed_intake_is_explicitly_not_a_replay(self):
        for rows in ([], [self.make_row(confirmed=False)]):
            status, report = self.run_gate(rows)
            self.assertEqual(status, 0)
            self.assertEqual(report["status"], "no-eligible-defects")
            self.assertEqual(report["confirmedCriticalCount"], 0)
            self.assertEqual(report["replayedDefectIds"], [])

    def test_newly_confirmed_critical_without_receipt_fails(self):
        status, report = self.run_gate([self.make_row()])
        self.assertEqual(status, 1)
        self.assertEqual(report["newlyConfirmedCriticalCount"], 1)
        self.assertEqual(report["status"], "failed")
        self.assertRegex(report["errors"][0], "regressionArtifact")

    def test_approval_exception_or_structural_proof_is_not_reported_as_replay(self):
        proof = {
            "schemaVersion": 1, "defectId": "TEST-2", "regressionDisposition": "structural-prevention",
            "intendedBehavior": "Invalid state is unrepresentable.",
            "proof": {"revision": "a" * 40, "outcome": "verified", "mechanism": "type invariant",
                      "verificationReference": "compile-negative fixture"},
        }
        raw = gate.canonical_json(proof)
        artifact = self.intake.parent / "structural.json"
        artifact.write_bytes(raw)
        structural = self.make_row(defectId="TEST-2", regressionDisposition="structural-prevention",
                                   regressionArtifact=artifact.name, regressionArtifactSha256=hashlib.sha256(raw).hexdigest())
        status, report = self.run_gate([self.exception(), structural])
        self.assertEqual(status, 0)
        self.assertEqual(report["status"], "receipt-validation-only")
        self.assertEqual(report["receiptOrExceptionCount"], 2)
        self.assertEqual(report["replayedDefectIds"], [])
        artifact.write_bytes(raw + b" ")
        self.assertEqual(self.run_gate([structural])[0], 1)
        self.assertEqual(self.run_gate([dict(self.exception(), approvedBy="")])[0], 1)

    def test_existing_critical_entry_cannot_be_removed_or_downgraded(self):
        self.git("init", "-q")
        self.git("config", "user.name", "Fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        self.assertEqual(self.run_gate([self.exception()])[0], 0)
        self.git("add", gate.INTAKE)
        self.git("commit", "-qm", "approved critical disposition")
        baseline = self.git("rev-parse", "HEAD")
        self.assertEqual(self.run_gate([self.exception()], base=baseline)[1]["newlyConfirmedCriticalCount"], 0)
        for rows in ([], [dict(self.exception(), confirmed=False)], [dict(self.exception(), severity="high")]):
            status, report = self.run_gate(rows, base=baseline)
            self.assertEqual(status, 1)
            self.assertIn("cannot be removed or downgraded", report["errors"][0])

    def test_transition_from_unconfirmed_is_checked_against_base(self):
        self.git("init", "-q")
        self.git("config", "user.name", "Fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        self.assertEqual(self.run_gate([self.make_row(confirmed=False)])[0], 0)
        self.git("add", gate.INTAKE)
        self.git("commit", "-qm", "unconfirmed candidate")
        status, report = self.run_gate([self.make_row()], base=self.git("rev-parse", "HEAD"))
        self.assertEqual(status, 1)
        self.assertEqual(report["newlyConfirmedCriticalCount"], 1)

    def test_registered_replays_are_bound_and_prioritized(self):
        old = {"known": self.make_row(defectId="known", replay="null-receipt")}
        new = self.make_row(defectId="new", replay="missing-defects")
        self.assertEqual(gate.replay_selection(old, old | {"new": new}), [new, old["known"]])
        with self.assertRaisesRegex(ValueError, "cannot be removed or substituted"):
            gate.replay_selection(old, {"known": self.make_row(defectId="known")})
        with patch.object(gate, "SAMPLE_LIMIT", 1):
            with self.assertRaisesRegex(ValueError, "exceed the bounded sample"):
                gate.replay_selection({}, old | {"new": new})
        status, report = self.run_gate([self.make_row(replay="null-receipt")])
        self.assertEqual(status, 1)
        self.assertIn("registered probe", report["errors"][0])

    def test_missing_base_is_an_error_not_an_empty_intake(self):
        status, report = self.run_gate([], base="f" * 40)
        self.assertEqual(status, 1)
        self.assertIn("revision is unavailable", report["errors"][0])

    def test_replay_must_match_even_if_the_changed_receipt_has_a_valid_digest(self):
        source = ROOT / gate.INTAKE
        row = gate.read_intake(json.loads(source.read_bytes()))[0]
        receipt = json.loads((source.parent / row["regressionArtifact"]).read_bytes())
        artifact = self.intake.parent / row["regressionArtifact"]
        artifact.parent.mkdir()
        changed = receipt | {"intendedBehavior": "Different behavior."}
        raw = gate.canonical_json(changed)
        artifact.write_bytes(raw)
        row = row | {"regressionArtifactSha256": hashlib.sha256(raw).hexdigest()}
        self.intake.write_bytes(gate.canonical_json({"schemaVersion": 1, "defects": [row]}))
        with patch.object(gate, "replay", return_value=receipt):
            with self.assertRaisesRegex(ValueError, "does not match"):
                gate.check(self.root, self.intake, self.root, None, False,
                           {"errors": [], "replayedDefectIds": []})
