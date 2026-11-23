"""Goldens for explicitly attested duplicate historical fixing PR reviews."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from aspects_validate_historical_pins import audited_rows_sha256
from aspects_verify_duplicate_fix_relationship import verify_duplicate_relationships

ROOT = Path(__file__).resolve().parents[2]
SHA = "c21b578f95fa131db853346d0911a45621098067"
ANCHOR = {"status": "verified_first_parent_sha_membership",
          "head_sha": "a" * 40, "oldest_sha": "b" * 40}
EVIDENCE_FILE = ROOT / (
    "docs/engineering/aspects-historical/fix-pr-state-checkpoints/"
    "2026-11-22-duplicate-6702-of-6701.json"
)


class ExplicitDuplicateRelationshipTests(unittest.TestCase):
    def setUp(self):
        self.history = [
            {"excel_row": 36, "review_id": "#6701", "defects_recorded": 1,
             "reviewed_master_sha": SHA,
             "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/6701"},
            {"excel_row": 37, "review_id": "#6701", "defects_recorded": 1,
             "reviewed_master_sha": SHA,
             "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/6702"},
        ]
        self.audit = [
            {"excel_row": n, "reviewed_master_sha": SHA,
             "window_membership": "in_window", "pin_status": "not_parseable"}
            for n in (36, 37)
        ]
        self.report = {
            "audited_rows_sha256": audited_rows_sha256(self.audit),
            "first_parent_checkpoint": ANCHOR,
        }
        self.evidence = json.loads(EVIDENCE_FILE.read_text(encoding="utf-8"))

    def validate(self):
        return verify_duplicate_relationships(
            self.history, self.audit, self.report, self.evidence,
            expected_records=2, first_excel_row=36,
        )

    def test_duplicate_is_one_known_relationship_not_two_discoveries(self):
        outcome = self.validate()
        self.assertEqual(outcome["explicit_duplicate_review_relationships"], 1)
        self.assertEqual(outcome["review_events_preserved_without_recount"], 2)
        self.assertEqual(outcome["links"][0]["primary_fix_pr"], 6701)
        self.assertEqual(outcome["links"][0]["duplicate_review_pr"], 6702)
        self.assertEqual(outcome["new_reviewed_LOC_added"], 0)
        self.assertEqual(outcome["new_distinct_defects_discovered"], 0)
        self.assertIsNone(outcome["historical_463_distinct_defects_recomputed"])
        self.assertIsNone(outcome["new_comparable_900_density"])

    def test_actual_immutable_workbook_rows_match_the_attestation(self):
        shard = ROOT / "docs/engineering/aspects-historical/review-events/0000-0239.jsonl"
        original = [json.loads(line) for line in shard.read_text(encoding="utf-8").splitlines()]
        selected = [row for row in original if row["excel_row"] in (36, 37)]
        self.assertEqual(len(selected), 2)
        self.assertEqual([x["review_id"] for x in selected], ["#6701", "#6701"])
        self.assertEqual([x["defects_recorded"] for x in selected], [1, 1])
        self.assertEqual([x["source_reference"] for x in selected],
                         [x["source_reference"] for x in self.history])
        self.assertEqual([x["reviewed_master_sha"] for x in selected], [SHA, SHA])

    def test_wrong_duplicate_reference_does_not_get_promoted(self):
        self.history[1]["source_reference"] = (
            "https://github.com/joefrancisGA/ArchLucid/pull/6703")
        with self.assertRaisesRegex(ValueError, "identity, PR link"):
            self.validate()

    def test_window_rotation_excludes_old_review_pair(self):
        self.audit[1]["window_membership"] = "not_on_first_parent_window"
        self.report["audited_rows_sha256"] = audited_rows_sha256(self.audit)
        with self.assertRaisesRegex(ValueError, "same verified 900"):
            self.validate()

    def test_audit_tampering_with_unchanged_row_counts_is_rejected(self):
        self.audit[0]["reviewed_master_sha"] = "c" * 40
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            self.validate()

    def test_narrative_without_explicit_same_defect_is_not_proof(self):
        self.evidence["duplicate_references"][0][
            "original_duplicate_pr_description_excerpt"
        ] = "The two pull requests are from the same time."
        with self.assertRaisesRegex(ValueError, "explicit duplicate"):
            self.validate()

    def test_closed_unmerged_primary_is_not_the_merged_fix(self):
        self.evidence["duplicate_references"][0]["primary_pr_state_at_check"] = (
            "closed_unmerged")
        with self.assertRaisesRegex(ValueError, "checked fix statuses"):
            self.validate()

    def test_duplicate_assertion_cannot_claim_pair_twice(self):
        self.evidence["duplicate_references"].append(
            deepcopy(self.evidence["duplicate_references"][0]))
        with self.assertRaisesRegex(ValueError, "Duplicate/overlapping"):
            self.validate()


if __name__ == "__main__":
    unittest.main()
