"""Goldens for discovery-ID reconciliation independent of fixing-PR state."""
from __future__ import annotations

import copy
import hashlib
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import aspects_reconcile_historical_defect_ids as sut
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256


class HistoricalDefectIdTests(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {"excel_row": 7, "review_id": "ASPECTS-ONE",
             "defects_recorded": 1, "reviewed_master_sha": "a" * 40,
             "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/123",
             "historical_status": "Confirmed · PR #123 open",
             "parsed_pin": {"path": "src/a.cs"}},
            {"excel_row": 8, "review_id": "Aspects-clean",
             "defects_recorded": 0, "reviewed_master_sha": "a" * 40,
             "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/123",
             "historical_status": "no confirmed defect"},
            {"excel_row": 9, "review_id": "ASPECTS-ONE",
             "defects_recorded": 1, "reviewed_master_sha": "a" * 40,
             "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/124",
             "historical_status": "Confirmed · PR #124 open"},
        ]
        self.audit = [
            {"excel_row": row["excel_row"], "review_id": row["review_id"],
             "reviewed_master_sha": "a" * 40,
             "pin_status": VERIFIED,
             "window_membership": "in_window"} for row in self.rows
        ]
        self.pin_report = {
            "audited_rows_sha256": audited_rows_sha256(self.audit),
            "first_parent_checkpoint": {
                "status": "verified_first_parent_sha_membership",
                "head_sha": "a" * 40,
                "oldest_sha": "b" * 40,
                "first_parent_commits": 900,
            },
        }
        self.pr_statuses = {
            "repository": "joefrancisGA/ArchLucid",
            "checked_at_utc": "2026-11-23T00:00:00Z",
            "pr_states": [
                {"number": 123, "state": "closed", "merged": True,
                 "merged_at": "2026-11-22T14:00:00Z",
                 "status_verified_at_utc": "2026-11-23T00:00:00Z",
                 "fix_pr_url": "https://github.com/joefrancisGA/ArchLucid/pull/123"},
            ],
        }
        self.recent = [{"defect_id": "ASPECTS-ONE", "verified": True}]

    def refresh_audit_digest(self):
        self.pin_report["audited_rows_sha256"] = audited_rows_sha256(self.audit)

    def set_original_id(self, index, value):
        self.rows[index]["review_id"] = value
        self.audit[index]["review_id"] = value
        self.refresh_audit_digest()

    def add_source_backed_duplicate_assertion(self):
        self.pr_statuses["pr_states"].append({
            "number": 124, "state": "closed", "merged": False,
            "merged_at": None, "status_verified_at_utc": "2026-11-23T00:00:00Z",
            "fix_pr_url": "https://github.com/joefrancisGA/ArchLucid/pull/124"})
        excerpt = ("A parallel review opened #123 for the same defect before this PR "
                   "became visible. #123 is the active fix.")
        body = excerpt + "\n\nIndependent verification and review spans follow."
        assertion = {
            "candidate_identity": {"namespace": "workbook_aspects_id", "value": "ASPECTS-ONE"},
            "canonical_fix_pr": 123, "duplicate_fix_pr": 124, "source_pr": 124,
            "source_url": "https://github.com/joefrancisGA/ArchLucid/pull/124",
            "source_excerpt": excerpt, "source_body": body,
            "source_sha256": hashlib.sha256(body.encode("utf-8")).hexdigest(),
            "checked_at_utc": "2026-11-23T00:00:00Z",
        }
        self.pr_statuses["discovery_identity_assertions"] = [assertion]
        return assertion

    def add_missing_operational_drain_fix_assertion(self):
        self.set_original_id(0, "Operational drain")
        reviewed_sha = "e810c4057170297b59abd9381b92c891f05aa5ce"
        self.rows[0].update({"reviewed_master_sha": reviewed_sha,
                             "source_reference": None, "historical_status": "Measured",
                             "parsed_pin": None, "reviewed_loc_reported": 172})
        self.audit[0].update({"reviewed_master_sha": reviewed_sha,
                              "pin_status": "not_parseable"})
        self.refresh_audit_digest()
        self.pr_statuses["pr_states"].append({
            "number": 6639, "state": "closed", "merged": True,
            "merged_at": "2026-11-16T15:58:52Z",
            "status_verified_at_utc": "2026-11-23T00:00:00Z",
            "fix_pr_url": "https://github.com/joefrancisGA/ArchLucid/pull/6639"})
        excerpt = ("One distinct confirmed application defect in 183 unique nonblank "
                   "application-source lines. This is the same defect documented in the earlier aggregate.")
        body = "Reviewed master e810c405. " + excerpt
        assertion = {
            "excel_row": 7, "review_id": "Operational drain", "reviewed_master_sha": reviewed_sha,
            "fix_pr_number": 6639, "source_pr": 6639,
            "source_url": "https://github.com/joefrancisGA/ArchLucid/pull/6639",
            "source_excerpt": excerpt, "source_body": body,
            "source_sha256": hashlib.sha256(body.encode("utf-8")).hexdigest(),
            "checked_at_utc": "2026-11-23T00:00:00Z",
        }
        self.pr_statuses["missing_fix_pr_assertions"] = [assertion]
        return assertion

    def calculate(self):
        return sut.reconcile(
            self.rows, self.audit, self.pin_report,
            self.recent,
            self.pr_statuses, expected_count=3, expected_first_excel_row=7)

    def test_duplicate_discovery_id_is_one_candidate_not_two_defects(self):
        report, row_audits = self.calculate()
        self.assertEqual(report["positive_rows"], 2)
        self.assertEqual(report["unique_named_discovery_id_candidates"], 1)
        self.assertEqual(report["repeated_named_discovery_id_candidates"], 1)
        self.assertEqual(report["positive_rows_in_anchored_900_first_parent"], 2)
        self.assertEqual(report["unique_fix_pr_reference_candidates_in_anchored_window"], 2)
        self.assertEqual(report["positive_rows_without_fix_pr_reference_in_anchored_window"], 0)
        self.assertEqual(report["repeated_fix_pr_numbers_in_anchored_window"], 0)
        self.assertEqual(report["exact_candidate_id_also_in_narrow_ledger_rows"], 2)
        self.assertEqual(len(row_audits), 2)
        self.assertIsNone(report["historical_463_distinct_defects_recomputed"])
        self.assertIsNone(report["fresh_comparable_900_density"])

    def test_merged_pr_overrides_stale_open_label_without_new_defect(self):
        report, rows = self.calculate()
        self.assertEqual(report["github_fix_pr_state_verified_rows"], 1)
        self.assertEqual(report["historical_open_labels_now_verified_merged"], 1)
        self.assertEqual(rows[0]["fix_state"], "merged")
        self.assertEqual(rows[1]["fix_state"], "not_independently_checked")
        self.assertIsNone(rows[1]["fix_state_checked_at_utc"])
        self.assertEqual(report["unique_named_discovery_id_candidates"], 1)

    def test_missing_pr_status_is_unknown_not_historically_open(self):
        _, rows = self.calculate()
        self.assertEqual(rows[1]["fix_pr_number"], 124)
        self.assertEqual(rows[1]["fix_state"], "not_independently_checked")

    def test_conflicting_original_pr_refs_are_not_guessed(self):
        self.rows[0]["historical_status"] = "Confirmed · PR #999 open"
        _, rows = self.calculate()
        self.assertEqual(rows[0]["fix_pr_reference_confidence"],
                         "conflicting_original_fix_pr_references")
        self.assertEqual(rows[0]["fix_state"], "not_independently_checked")
        self.assertIsNone(rows[0]["fix_pr_number"])

    def test_closed_unmerged_and_open_are_not_labeled_fixed(self):
        self.pr_statuses["pr_states"] = [
            {"number": n, "state": state, "merged": False,
             "status_verified_at_utc": "2026-11-23T00:00:00Z",
             "fix_pr_url": f"https://github.com/joefrancisGA/ArchLucid/pull/{n}"}
            for n, state in ((123, "closed"), (124, "open"))
        ]
        _, rows = self.calculate()
        self.assertEqual([r["fix_state"] for r in rows],
                         ["closed_unmerged", "open"])

    def test_digest_mismatch_blocks_reconciliation(self):
        self.audit[0]["window_membership"] = "not_on_first_parent_window"
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            self.calculate()

    def test_missing_historical_review_row_blocks_reconciliation(self):
        self.rows.pop()
        with self.assertRaisesRegex(ValueError, "Incomplete"):
            self.calculate()

    def test_bad_pr_metadata_blocks_reconciliation(self):
        self.pr_statuses["pr_states"][0]["state"] = "open"
        with self.assertRaisesRegex(ValueError, "Malformed"):
            self.calculate()

    def test_clean_review_never_creates_discovery_or_fix_observation(self):
        self.rows[0]["defects_recorded"] = 0
        self.rows[2]["defects_recorded"] = 0
        report, events = self.calculate()
        self.assertEqual(report["positive_rows"], 0)
        self.assertEqual(report["unique_named_discovery_id_candidates"], 0)
        self.assertEqual(events, [])
        self.assertEqual(report["clean_rows_identity_bound"], 3)

    def test_original_number_and_aspects_ids_keep_separate_namespaces(self):
        self.set_original_id(0, "#6619")
        self.set_original_id(2, "ASPECTS-6619")
        self.recent = [{"defect_id": "#6619"}, {"defect_id": "ASPECTS-6619"}]
        report, events = self.calculate()
        scope = report["candidate_discovery_id_scopes"]["all_history"]
        self.assertEqual(scope["unique_candidate_ids"], 2)
        self.assertEqual(scope["unique_candidates_by_namespace"], {
            "workbook_aspects_id": 1, "workbook_pr_number": 1})
        self.assertEqual(events[0]["review_id"], "#6619")
        self.assertEqual(events[0]["discovery_id_candidate"], {
            "namespace": "workbook_pr_number", "value": "#6619"})
        self.assertIsNone(events[0]["named_discovery_id_candidate"])
        self.assertFalse(events[0]["in_narrow_recent_ledger_exact_defect_id"])
        self.assertTrue(events[1]["in_narrow_recent_ledger_exact_defect_id"])
        self.assertEqual(report["exact_candidate_id_also_in_narrow_ledger_rows"], 1)
        self.assertEqual(report["unique_named_discovery_id_candidates"], 1)
        self.assertIsNone(report["historical_463_distinct_defects_recomputed"])

    def test_repeated_candidate_counts_are_separate_for_all_history_and_window(self):
        self.set_original_id(0, "#6619")
        self.set_original_id(2, "#6619")
        self.audit[2]["window_membership"] = "not_on_first_parent_window"
        self.refresh_audit_digest()
        report, _ = self.calculate()
        all_history = report["candidate_discovery_id_scopes"]["all_history"]
        window = report["candidate_discovery_id_scopes"]["anchored_900_first_parent"]
        self.assertEqual(all_history["unique_candidate_ids"], 1)
        self.assertEqual(all_history["repeated_candidate_ids"], 1)
        self.assertEqual(window["unique_candidate_ids"], 1)
        self.assertEqual(window["repeated_candidate_ids"], 0)
        self.assertEqual(report["positive_rows"], 2)
        self.assertEqual(report["positive_rows_in_anchored_900_first_parent"], 1)

    def test_conflicting_fix_prs_for_original_6701_id_require_review(self):
        # Real workbook pattern: Excel rows 36/37 both say '#6701', but link
        # distinct PRs 6701/6702. It is unsafe to silently correct or dedup them.
        for index, number in ((0, 6701), (2, 6702)):
            self.set_original_id(index, "#6701")
            self.rows[index]["source_reference"] = (
                f"https://github.com/joefrancisGA/ArchLucid/pull/{number}")
            self.rows[index]["historical_status"] = "Measured"
        report, records = self.calculate()
        scope = report["candidate_discovery_id_scopes"]["anchored_900_first_parent"]
        self.assertEqual(scope["unique_candidate_ids"], 1)
        self.assertEqual(scope["candidate_ids_with_conflicting_fix_prs"], 1)
        self.assertEqual(scope["conflicting_fix_prs_sample"], [{
            "namespace": "workbook_pr_number", "value": "#6701",
            "excel_rows_by_fix_pr": {"6701": [7], "6702": [9]},
            "status": "multiple_fix_prs_requires_discovery_identity_review"}])
        self.assertEqual([r["fix_pr_number"] for r in records], [6701, 6702])
        self.assertIsNone(report["fresh_comparable_900_density"])

    def test_original_opaque_label_remains_candidate_without_invented_pr(self):
        self.set_original_id(0, "Operational drain")
        self.rows[0]["source_reference"] = None
        self.rows[0]["historical_status"] = "Measured"
        report, records = self.calculate()
        self.assertEqual(records[0]["discovery_id_candidate"], {
            "namespace": "workbook_label", "value": "Operational drain"})
        self.assertIsNone(records[0]["fix_pr_number"])
        self.assertEqual(report["candidate_discovery_id_scopes"]["all_history"]
                         ["unique_candidate_ids"], 2)
        self.assertEqual(report["unresolved_discovery_or_fix_evidence"]
                         ["opaque_workbook_discovery_label"], 1)

    def test_raw_spelling_is_not_normalized_into_an_exact_match(self):
        for raw in (" ASPECTS-ONE ", "aspects-one", "#06619"):
            with self.subTest(raw=raw):
                self.set_original_id(0, raw)
                _, events = self.calculate()
                self.assertEqual(events[0]["review_id"], raw)
                self.assertEqual(events[0]["discovery_id_candidate"], {
                    "namespace": "workbook_label", "value": raw})
                self.assertFalse(events[0]["in_narrow_recent_ledger_exact_defect_id"])

    def test_empty_original_id_is_unresolved_not_a_new_candidate(self):
        self.set_original_id(0, "  ")
        report, events = self.calculate()
        self.assertIsNone(events[0]["discovery_id_candidate"])
        self.assertEqual(report["candidate_discovery_id_scopes"]["all_history"]
                         ["unique_candidate_ids"], 1)

    def test_clean_row_sha_mismatch_blocks_reconciliation(self):
        self.audit[1]["reviewed_master_sha"] = "c" * 40
        self.refresh_audit_digest()
        with self.assertRaisesRegex(ValueError, "source SHA disagrees.*8"):
            self.calculate()

    def test_clean_original_id_mismatch_blocks_reconciliation(self):
        self.audit[1]["review_id"] = "a different original ID"
        self.refresh_audit_digest()
        with self.assertRaisesRegex(ValueError, "original review ID disagrees.*8"):
            self.calculate()

    def test_complete_900_anchor_is_required(self):
        anchor = self.pin_report["first_parent_checkpoint"]
        for field, invalid_values in (
                ("head_sha", (None, "a" * 39, "x" * 40)),
                ("oldest_sha", (None, "b" * 41, "z" * 40)),
                ("first_parent_commits", (None, 899, 901, True, "900"))):
            original = anchor[field]
            for invalid in invalid_values:
                with self.subTest(field=field, invalid=invalid):
                    anchor[field] = invalid
                    with self.assertRaisesRegex(ValueError, "900-commit anchor"):
                        self.calculate()
            anchor[field] = original

    def test_unknown_membership_cannot_ride_a_verified_anchor(self):
        self.audit[1]["window_membership"] = "membership_unverified"
        self.refresh_audit_digest()
        with self.assertRaisesRegex(ValueError, "window membership unverified.*8"):
            self.calculate()

    def test_all_status_pr_references_are_checked_for_ambiguity(self):
        self.rows[0]["historical_status"] = "Confirmed PR #123 and PR #456 open"
        _, events = self.calculate()
        self.assertIsNone(events[0]["fix_pr_number"])
        self.assertEqual(events[0]["fix_pr_reference_confidence"],
                         "conflicting_original_fix_pr_references")
        self.assertEqual(events[0]["fix_state"], "not_independently_checked")

    def test_multiple_original_source_pr_links_are_ambiguous(self):
        self.rows[0]["source_reference"] += (
            "; https://github.com/joefrancisGA/ArchLucid/pull/456")
        _, events = self.calculate()
        self.assertIsNone(events[0]["fix_pr_number"])
        self.assertEqual(events[0]["fix_pr_reference_confidence"],
                         "conflicting_original_fix_pr_references")

    def test_repeated_reference_to_same_pr_is_not_ambiguous(self):
        self.rows[0]["historical_status"] = "PR #123 open; corrective PR #123"
        _, events = self.calculate()
        self.assertEqual(events[0]["fix_pr_number"], 123)
        self.assertEqual(events[0]["fix_state"], "merged")

    def test_identity_and_output_digests_are_deterministic_and_bound_to_clean_ids(self):
        first, first_events = self.calculate()
        self.rows.reverse()
        self.audit.reverse()
        self.refresh_audit_digest()
        reordered, reordered_events = self.calculate()
        self.assertEqual(first["original_identity_rows_sha256"],
                         reordered["original_identity_rows_sha256"])
        self.assertEqual(first["discovery_fix_rows_sha256"],
                         reordered["discovery_fix_rows_sha256"])
        self.assertEqual(first_events, reordered_events)
        self.set_original_id(1, "another clean review identifier")
        changed, _ = self.calculate()
        self.assertNotEqual(first["original_identity_rows_sha256"],
                            changed["original_identity_rows_sha256"])
        self.assertEqual(changed["discovery_fix_rows_sha256"],
                         audited_rows_sha256(first_events))

    def test_explicit_source_assertion_resolves_only_the_documented_duplicate_relation(self):
        before, _ = self.calculate()
        self.add_source_backed_duplicate_assertion()
        report, records = self.calculate()
        for name in ("all_history", "anchored_900_first_parent"):
            prior = before["candidate_discovery_id_scopes"][name]
            scope = report["candidate_discovery_id_scopes"][name]
            self.assertEqual(prior["candidate_ids_with_unresolved_fix_pr_conflicts"], 1)
            self.assertEqual(scope["candidate_ids_with_conflicting_fix_prs"], 1)
            self.assertEqual(scope["candidate_ids_with_source_resolved_fix_pr_conflicts"], 1)
            self.assertEqual(scope["candidate_ids_with_unresolved_fix_pr_conflicts"], 0)
            self.assertEqual(scope["unique_candidate_ids"], prior["unique_candidate_ids"])
        self.assertEqual(report["source_backed_duplicate_fix_pr_relations"], 1)
        self.assertEqual([r["fix_pr_number"] for r in records], [123, 124])
        self.assertEqual([r["fix_state"] for r in records], ["merged", "closed_unmerged"])
        self.assertEqual(len(records[0]["source_backed_duplicate_relations"]), 1)
        self.assertEqual(len(records[1]["source_backed_duplicate_relations"]), 1)
        self.assertIsNone(report["historical_463_distinct_defects_recomputed"])
        self.assertIsNone(report["fresh_comparable_900_density"])

    def test_unlisted_fix_pr_cannot_be_resolved_by_assertion(self):
        assertion = self.add_source_backed_duplicate_assertion()
        assertion["duplicate_fix_pr"] = 456
        assertion["source_pr"] = 456
        assertion["source_url"] = "https://github.com/joefrancisGA/ArchLucid/pull/456"
        with self.assertRaisesRegex(ValueError, "original candidate and fixing PR evidence"):
            self.calculate()

    def test_assertion_cannot_alias_an_unrelated_original_candidate(self):
        assertion = self.add_source_backed_duplicate_assertion()
        assertion["candidate_identity"] = {"namespace": "workbook_pr_number", "value": "#123"}
        with self.assertRaisesRegex(ValueError, "original candidate and fixing PR evidence"):
            self.calculate()

    def test_duplicate_identity_assertion_is_rejected(self):
        assertion = self.add_source_backed_duplicate_assertion()
        self.pr_statuses["discovery_identity_assertions"].append(copy.deepcopy(assertion))
        with self.assertRaisesRegex(ValueError, "Duplicate or conflicting"):
            self.calculate()

    def test_assertion_requires_actual_hashed_body_and_embedded_excerpt(self):
        assertion = self.add_source_backed_duplicate_assertion()
        original = copy.deepcopy(assertion)
        for field, value in (("source_body", "modified body"),
                             ("source_sha256", "0" * 64),
                             ("source_excerpt", "invented quotation")):
            with self.subTest(field=field):
                assertion.update(original)
                assertion[field] = value
                with self.assertRaisesRegex(ValueError, "body/excerpt SHA-256"):
                    self.calculate()

    def test_assertion_source_url_and_utc_timestamp_are_required(self):
        assertion = self.add_source_backed_duplicate_assertion()
        assertion["source_url"] = "https://github.com/joefrancisGA/ArchLucid/pull/123"
        with self.assertRaisesRegex(ValueError, "original candidate and fixing PR evidence"):
            self.calculate()
        assertion["source_url"] = "https://github.com/joefrancisGA/ArchLucid/pull/124"
        assertion["checked_at_utc"] = "2026-11-23T00:00:00"
        with self.assertRaisesRegex(ValueError, "UTC evidence timestamp"):
            self.calculate()

    def test_closed_unmerged_metadata_is_required_for_a_duplicate_fix_pr(self):
        self.add_source_backed_duplicate_assertion()
        self.pr_statuses["pr_states"][1]["state"] = "open"
        with self.assertRaisesRegex(ValueError, "original candidate and fixing PR evidence"):
            self.calculate()

    def test_one_assertion_does_not_resolve_an_unmapped_third_pr(self):
        self.add_source_backed_duplicate_assertion()
        self.set_original_id(1, "ASPECTS-ONE")
        self.rows[1]["defects_recorded"] = 1
        self.rows[1]["source_reference"] = "https://github.com/joefrancisGA/ArchLucid/pull/456"
        self.rows[1]["historical_status"] = "Confirmed"
        report, records = self.calculate()
        scope = report["candidate_discovery_id_scopes"]["all_history"]
        self.assertEqual(report["source_backed_duplicate_fix_pr_relations"], 1)
        self.assertEqual(scope["candidate_ids_with_source_resolved_fix_pr_conflicts"], 0)
        self.assertEqual(scope["candidate_ids_with_unresolved_fix_pr_conflicts"], 1)
        self.assertEqual(records[1]["source_backed_duplicate_relations"], [])

    def test_duplicate_assertion_does_not_promote_out_of_window_records(self):
        self.add_source_backed_duplicate_assertion()
        self.audit[2]["window_membership"] = "not_on_first_parent_window"
        self.refresh_audit_digest()
        report, _ = self.calculate()
        window = report["candidate_discovery_id_scopes"]["anchored_900_first_parent"]
        self.assertEqual(window["candidate_ids_with_conflicting_fix_prs"], 0)
        self.assertEqual(window["candidate_ids_with_source_resolved_fix_pr_conflicts"], 0)
        self.assertEqual(report["positive_rows_in_anchored_900_first_parent"], 1)

    def test_missing_operational_drain_fix_is_resolved_separately_from_original_fields(self):
        self.add_missing_operational_drain_fix_assertion()
        originals = copy.deepcopy(self.rows)
        report, events = self.calculate()
        self.assertEqual(self.rows, originals)
        event = events[0]
        self.assertEqual(event["review_id"], "Operational drain")
        self.assertEqual(event["discovery_id_candidate"], {
            "namespace": "workbook_label", "value": "Operational drain"})
        self.assertIsNone(event["original_source_reference"])
        self.assertIsNone(event["fix_pr_number"])
        self.assertEqual(event["resolved_fix_pr_number"], 6639)
        self.assertEqual(event["fix_pr_reference_confidence"], "no_explicit_fix_pr_reference")
        self.assertEqual(event["fix_pr_resolution_provenance"], "source_backed_missing_fix_pr_assertion")
        self.assertEqual(event["fix_state"], "merged")
        self.assertEqual(event["git_pin_status"], "not_parseable")
        self.assertEqual(report["source_backed_missing_fix_pr_references"], 1)
        self.assertEqual(report["positive_rows_without_fix_pr_reference_in_anchored_window"], 1)
        self.assertEqual(report["positive_unlinked_excel_rows_sample_in_anchored_window"], [7])
        self.assertEqual(report["github_fix_pr_state_verified_source_backed_reference_rows"], 1)
        self.assertEqual(report["github_fix_pr_state_verified_original_reference_rows"], 0)
        self.assertEqual(report["positive_rows"], 2)
        self.assertEqual(report["unresolved_discovery_or_fix_evidence"]["opaque_workbook_discovery_label"], 1)
        self.assertIsNone(report["historical_463_distinct_defects_recomputed"])
        self.assertIsNone(report["fresh_comparable_900_density"])

    def test_missing_fix_assertion_does_not_assume_a_fix_has_merged(self):
        self.add_missing_operational_drain_fix_assertion()
        self.pr_statuses["pr_states"][-1].update({"state": "open", "merged": False, "merged_at": None})
        report, events = self.calculate()
        self.assertEqual(events[0]["fix_state"], "open")
        self.assertEqual(events[0]["resolved_fix_pr_number"], 6639)
        self.assertEqual(report["positive_rows"], 2)

    def test_missing_fix_assertion_cannot_override_original_pr_link(self):
        self.add_missing_operational_drain_fix_assertion()
        self.rows[0]["source_reference"] = "https://github.com/joefrancisGA/ArchLucid/pull/123"
        with self.assertRaisesRegex(ValueError, "cannot override original explicit or conflicting"):
            self.calculate()

    def test_missing_fix_assertion_cannot_bypass_conflicting_original_references(self):
        self.add_missing_operational_drain_fix_assertion()
        self.rows[0]["source_reference"] = "https://github.com/joefrancisGA/ArchLucid/pull/123"
        self.rows[0]["historical_status"] = "Confirmed PR #124 open"
        with self.assertRaisesRegex(ValueError, "cannot override original explicit or conflicting"):
            self.calculate()

    def test_missing_fix_assertion_cannot_override_embedded_source_reference(self):
        self.add_missing_operational_drain_fix_assertion()
        self.rows[0]["source_reference"] = "Evidence: https://github.com/joefrancisGA/ArchLucid/pull/123"
        with self.assertRaisesRegex(ValueError, "cannot override original explicit or conflicting"):
            self.calculate()

    def test_missing_fix_assertion_requires_exact_original_row_identity(self):
        assertion = self.add_missing_operational_drain_fix_assertion()
        original = copy.deepcopy(assertion)
        for field, value in (("excel_row", 999), ("review_id", "another label"),
                             ("reviewed_master_sha", "b" * 40)):
            with self.subTest(field=field):
                assertion.update(original)
                assertion[field] = value
                with self.assertRaisesRegex(ValueError, "original positive row and GitHub PR evidence"):
                    self.calculate()

    def test_missing_fix_assertion_cannot_turn_clean_review_into_discovery(self):
        self.add_missing_operational_drain_fix_assertion()
        self.rows[0]["defects_recorded"] = 0
        with self.assertRaisesRegex(ValueError, "original positive row and GitHub PR evidence"):
            self.calculate()

    def test_duplicate_missing_fix_assertions_are_rejected(self):
        assertion = self.add_missing_operational_drain_fix_assertion()
        self.pr_statuses["missing_fix_pr_assertions"].append(copy.deepcopy(assertion))
        with self.assertRaisesRegex(ValueError, "Duplicate missing-fix PR assertion"):
            self.calculate()

    def test_missing_fix_assertion_requires_matching_pr_metadata_and_source_url(self):
        assertion = self.add_missing_operational_drain_fix_assertion()
        original = copy.deepcopy(assertion)
        for field, value in (("fix_pr_number", 999), ("source_pr", 123),
                             ("source_url", "https://github.com/joefrancisGA/ArchLucid/pull/123")):
            with self.subTest(field=field):
                assertion.update(original)
                assertion[field] = value
                with self.assertRaisesRegex(ValueError, "original positive row and GitHub PR evidence"):
                    self.calculate()
        assertion.update(original)
        self.pr_statuses["pr_states"].pop()
        with self.assertRaisesRegex(ValueError, "original positive row and GitHub PR evidence"):
            self.calculate()

    def test_missing_fix_assertion_requires_hashed_body_excerpt_and_utc_time(self):
        assertion = self.add_missing_operational_drain_fix_assertion()
        original = copy.deepcopy(assertion)
        for field, value in (("source_body", "different body"), ("source_sha256", "0" * 64),
                             ("source_excerpt", "different quotation"), ("checked_at_utc", "yesterday")):
            with self.subTest(field=field):
                assertion.update(original)
                assertion[field] = value
                with self.assertRaisesRegex(ValueError, "Missing-fix assertion"):
                    self.calculate()


    def test_exact_linked_numeric_review_id_is_candidate_key_not_distinct_defect(self):
        # Original workbook has defect-positive '#7269' style review IDs.
        self.set_original_id(0, "#123")
        report, rows = self.calculate()
        self.assertEqual(report["positive_rows_with_matching_pr_reference_review_key"], 1)
        self.assertEqual(report["unique_pr_reference_review_key_candidates"], 1)
        self.assertEqual(report["positive_rows_in_900_with_matching_pr_reference_review_key"], 1)
        self.assertEqual(rows[0]["fix_pr_reference_review_key_candidate"], "workbook_fix_pr:123")
        self.assertEqual(rows[0]["fix_pr_reference_review_key_confidence"],
                         "matching_workbook_review_id_and_source_pr_url")
        self.assertFalse(rows[0]["fix_pr_key_is_distinct_defect_proof"])
        self.assertIsNone(rows[0]["named_discovery_id_candidate"])
        self.assertIsNone(report["pr_reference_keys_proven_distinct_defects"])
        self.assertIsNone(report["historical_463_distinct_defects_recomputed"])

    def test_replayed_pr_number_review_key_never_double_counts_a_discovery(self):
        self.set_original_id(0, "#123")
        self.set_original_id(2, "#123")
        self.rows[2]["source_reference"] = self.rows[0]["source_reference"]
        self.rows[2]["historical_status"] = "Confirmed · PR #123 open"
        report, positive = self.calculate()
        self.assertEqual(report["positive_rows_with_matching_pr_reference_review_key"], 2)
        self.assertEqual(report["unique_pr_reference_review_key_candidates"], 1)
        self.assertEqual(report["repeated_pr_reference_review_key_candidates"], 1)
        self.assertEqual(report["unique_named_discovery_id_candidates"], 0)
        self.assertEqual(len(positive), 2)
        self.assertIsNone(report["fresh_comparable_900_density"])

    def test_discordant_numeric_id_and_original_pr_url_is_quarantined(self):
        self.set_original_id(0, "#999")
        report, rows = self.calculate()
        self.assertEqual(rows[0]["fix_pr_reference_review_key_candidate"], None)
        self.assertEqual(rows[0]["fix_pr_reference_review_key_confidence"],
                         "review_id_pr_number_not_confirmed_by_matching_source_link")
        self.assertEqual(report["pr_number_id_link_disagreement_or_missing_source_url_rows"], 1)
        self.assertEqual(report["unique_pr_reference_review_key_candidates"], 0)

    def test_status_text_only_is_insufficient_for_numeric_review_join_key(self):
        self.set_original_id(0, "#123")
        self.rows[0]["source_reference"] = "unrelated documentation"
        report, rows = self.calculate()
        self.assertEqual(rows[0]["fix_pr_number"], 123)
        self.assertEqual(rows[0]["fix_pr_reference_confidence"],
                         "historical_status_text_only")
        self.assertIsNone(rows[0]["fix_pr_reference_review_key_candidate"])
        self.assertEqual(report["unique_pr_reference_review_key_candidates"], 0)

    def test_immutable_workbook_numeric_review_identity_population_golden(self):
        # Inspect the actual 24 committed, checksum-guarded historical shards.
        # 672 original '#PR' IDs agree with their exact same-repository links;
        # one does not, and one other noncanonical positive ID is narrative.
        import json
        root = (Path(__file__).resolve().parents[2] /
                "docs/engineering/aspects-historical/review-events")
        events = [json.loads(line) for shard in sorted(root.glob("*.jsonl"))
                  for line in shard.read_text(encoding="utf-8").splitlines()
                  if line.strip()]
        self.assertEqual(len(events), 5741)
        positive = [row for row in events if row["defects_recorded"] > 0]
        self.assertEqual(len(positive), 877)
        matched = discordant = unrelated = 0
        for row in positive:
            number, confidence = sut.referenced_fix_pr(row)
            key, reason = sut.fix_pr_reference_candidate(row, number, confidence)
            if key is not None:
                matched += 1
                self.assertEqual(key, f"workbook_fix_pr:{number}")
                self.assertEqual(reason, "matching_workbook_review_id_and_source_pr_url")
            elif str(row.get("review_id", "")).strip().startswith("#"):
                discordant += 1
            elif not str(row.get("review_id", "")).strip().startswith("ASPECTS"):
                unrelated += 1
        self.assertEqual((matched, discordant, unrelated), (672, 1, 1))
        by_row = {row["excel_row"]: row for row in positive}
        self.assertEqual(by_row[37]["review_id"], "#6701")
        self.assertEqual(by_row[37]["source_reference"].rsplit("/", 1)[-1], "6702")
        self.assertEqual(by_row[27]["review_id"], "Operational drain")

    def test_unlinked_confirmed_observation_is_not_erased_to_match_pr_count(self):
        # Workbook may confirm a defect while its fix PR is still pending.
        # The absence of a PR is not evidence that the discovery is a repeat.
        self.rows[2]["source_reference"] = None
        self.rows[2]["historical_status"] = "Measured — fixing PR pending"
        report, positives = self.calculate()
        self.assertEqual(report["positive_rows_in_anchored_900_first_parent"], 2)
        self.assertEqual(report["unique_fix_pr_reference_candidates_in_anchored_window"], 1)
        self.assertEqual(report["positive_rows_without_fix_pr_reference_in_anchored_window"], 1)
        self.assertEqual(report["positive_unlinked_excel_rows_sample_in_anchored_window"], [9])
        self.assertIsNone(positives[1]["fix_pr_number"])
        self.assertIsNone(report["historical_463_distinct_defects_recomputed"])

    def test_reused_fix_pr_does_not_prove_duplicate_discovery(self):
        self.rows[2]["source_reference"] = self.rows[0]["source_reference"]
        self.rows[2]["historical_status"] = "Confirmed · PR #123 open"
        report, _ = self.calculate()
        self.assertEqual(report["unique_fix_pr_reference_candidates_in_anchored_window"], 1)
        self.assertEqual(report["repeated_fix_pr_numbers_in_anchored_window"], 1)
        self.assertEqual(report["repeated_fix_pr_reference_rows_sample"], {"123": [7, 9]})
        self.assertIsNone(report["historical_463_distinct_defects_recomputed"])

if __name__ == "__main__":
    unittest.main()

