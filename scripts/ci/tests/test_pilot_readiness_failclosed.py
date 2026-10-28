"""Adversarial offline release-bundle validation contracts."""

from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pilot_readiness_bundle_gate_common import (  # noqa: E402
    EXPECTED_SLOT_KEYS,
    validate_offline_bundle_report,
    validate_live_bundle_report,
)


def valid_offline() -> dict:
    return {
        "overallVerdict": "Pass",
        "slots": [
            {"slotKey": key, "verdict": "Skipped" if key == "ship-gate-evidence" else "Pass"}
            for key in EXPECTED_SLOT_KEYS
        ],
    }


class PilotReadinessFailClosedTests(unittest.TestCase):
    def test_known_good_offline_fixture_structure_passes(self):
        self.assertEqual(validate_offline_bundle_report(valid_offline()), [])

    def test_forty_adversarial_slot_verdict_fixtures_fail(self):
        # Eight slots by five invalid verdicts = 40 distinct mutations.
        # Two variants are unsupported statuses, one is missing, one is
        # explicit failure, and one is an unauthorized skip outside ship gate.
        invalid_verdicts = ["Fail", "Unknown", None, "", "PASS"]
        cases = 0
        for index, slot_key in enumerate(EXPECTED_SLOT_KEYS):
            for verdict in invalid_verdicts:
                with self.subTest(slot=slot_key, verdict=verdict):
                    report = valid_offline()
                    report["slots"][index]["verdict"] = verdict
                    issues = validate_offline_bundle_report(report)
                    self.assertTrue(issues, report)
                    cases += 1
        self.assertEqual(cases, 40)

    def test_forty_non_scalar_verdicts_fail_without_crashing(self):
        # A hostile JSON producer can supply lists/dicts as verdict values.
        # Membership testing against a set must not raise TypeError.
        bad_values = [[], {}, ["Pass"], {"verdict": "Pass"}, ["Fail", "Warn"]]
        cases = 0
        for index, slot_key in enumerate(EXPECTED_SLOT_KEYS):
            for value in bad_values:
                with self.subTest(slot=slot_key, verdict=value):
                    report = valid_offline()
                    report["slots"][index]["verdict"] = copy.deepcopy(value)
                    offline_issues = validate_offline_bundle_report(report)
                    self.assertTrue(offline_issues)
                    live = copy.deepcopy(report)
                    live["runId"] = "run-abc"
                    live["slots"][-1]["verdict"] = "Pass"
                    if index == len(EXPECTED_SLOT_KEYS) - 1:
                        live["slots"][index]["verdict"] = value
                    self.assertTrue(validate_live_bundle_report(live, run_id="run-abc"))
                    cases += 1
        self.assertEqual(cases, 40)

    def test_non_object_report_fails_without_crashing(self):
        for payload in ([], None, "text", 42, True):
            with self.subTest(payload=payload):
                self.assertTrue(validate_offline_bundle_report(payload))
                self.assertTrue(validate_live_bundle_report(payload, run_id="run-abc"))

    def test_unknown_duplicate_and_nonobject_slots_fail(self):
        for mutate in ("duplicate", "unexpected", "nonobject", "missing"):
            with self.subTest(mutate=mutate):
                report = valid_offline()
                if mutate == "duplicate":
                    report["slots"][-1] = copy.deepcopy(report["slots"][0])
                elif mutate == "unexpected":
                    report["slots"][-1]["slotKey"] = "foreign-slot"
                elif mutate == "nonobject":
                    report["slots"][0] = "not-a-slot"
                elif mutate == "missing":
                    report["slots"].pop()
                self.assertTrue(validate_offline_bundle_report(report))

    def test_unknown_overall_outcomes_fail_closed(self):
        for overall in ("", "Fail", "Skipped", "Unknown", "PASS", None):
            with self.subTest(overall=overall):
                report = valid_offline()
                report["overallVerdict"] = overall
                self.assertTrue(validate_offline_bundle_report(report))

    def test_live_requires_matching_nonempty_run_id(self):
        report = valid_offline()
        report["slots"][-1]["verdict"] = "Pass"
        report["runId"] = "run-abc"
        self.assertFalse(validate_live_bundle_report(report, run_id="run-abc"))
        for value in (None, "", "run-other"):
            with self.subTest(value=value):
                altered = copy.deepcopy(report)
                altered["runId"] = value
                self.assertTrue(validate_live_bundle_report(altered, run_id="run-abc"))


if __name__ == "__main__":
    unittest.main()
