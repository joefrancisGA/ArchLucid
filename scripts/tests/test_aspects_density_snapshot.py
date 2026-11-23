"""Prove Aspects density is fresh only when verified evidence actually changes."""
import importlib.util
import copy
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location("aspects_density_snapshot", ROOT / "aspects_density_snapshot.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

HEAD = "a" * 40
PREV = "b" * 40
OLD = "c" * 40
BLOB = "d" * 40
PREVIOUS_COHORT = [PREV] + [f"{n:040x}" for n in range(1, 899)] + [OLD]
CURRENT_COHORT = [HEAD] + PREVIOUS_COHORT[:-1]


def observation(defect, path="src/a.cs", spans=None, baseline=PREV, verified=True):
    return {
        "baseline": baseline,
        "blob": BLOB,
        "path": path,
        "spans": spans or [[1, 100]],
        "defect_id": defect,
        "verified": verified,
    }


class DensitySnapshotTests(unittest.TestCase):
    def test_full_900_cohort_preserves_order_anchors_and_digest(self):
        result = mod.build_snapshot([observation("D1")], CURRENT_COHORT, HEAD, 900)
        cohort = result["cohort"]
        self.assertEqual(result["schema_version"], 2)
        self.assertEqual(result["method"], "first_parent_verified_path_blob_span_union_v2")
        self.assertEqual(result["scope"], "narrow_incremental_review_ledger_subset")
        self.assertEqual(cohort["status"], "complete")
        self.assertEqual(cohort["actual_commits"], 900)
        self.assertEqual(cohort["requested_commits"], 900)
        self.assertEqual(cohort["head_sha"], HEAD)
        self.assertEqual(cohort["oldest_included_sha"], CURRENT_COHORT[-1])
        self.assertEqual(cohort["ordered_shas"], CURRENT_COHORT)
        self.assertEqual(cohort["ordered_shas_sha256"], hashlib.sha256(
            ("\n".join(CURRENT_COHORT) + "\n").encode("ascii")).hexdigest())
        self.assertIn("cross_revision_lineage_unresolved", result["confidence"])

    def test_real_git_first_parent_order_and_short_history(self):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            def git(*args):
                return subprocess.run(["git", "-C", str(repo), *args], check=True,
                                      capture_output=True, text=True).stdout.strip()
            git("init", "-q")
            git("config", "user.name", "Aspects test")
            git("config", "user.email", "aspects-test@example.invalid")
            commits = []
            for number in range(3):
                (repo / "source.txt").write_text(f"reviewed line {number}\n")
                git("add", "source.txt")
                git("commit", "-qm", f"fixture {number}")
                commits.append(git("rev-parse", "HEAD"))
            chain = mod.ordered_first_parent(repo, commits[-1], 900)
            self.assertEqual(chain, commits[::-1])
            result = mod.build_snapshot([], chain, commits[-1], 900)
            self.assertEqual(result["cohort"]["status"], "incomplete")
            self.assertEqual(result["cohort"]["actual_commits"], 3)
            self.assertIsNone(result["density"]["defects_per_kloc"])
            # Exercise the production CLI's Git pin validation and ordered-cohort
            # handoff using a complete three-commit test window, never real data.
            ledger = repo / "ledger.jsonl"
            ledger.write_text(json.dumps({"baseline": commits[-1],
                "blob": git("rev-parse", f"{commits[-1]}:source.txt"),
                "path": "source.txt", "spans": [[1, 1]],
                "defect_id": None, "verified": True}) + "\n")
            output = repo / "snapshot.json"
            subprocess.run([sys.executable, str(ROOT / "aspects_density_snapshot.py"),
                "--repo", str(repo), "--ledger", str(ledger), "--head", commits[-1],
                "--window", "3", "--historical-state", str(repo / "absent-history.json"),
                "--json-out", str(output), "--markdown-out", str(repo / "snapshot.md")],
                check=True, capture_output=True, text=True)
            actual = json.loads(output.read_text())
            self.assertEqual(actual["cohort"]["ordered_shas"], commits[::-1])
            self.assertEqual(actual["cohort"]["oldest_included_sha"], commits[0])
            self.assertEqual(actual["cohort"]["status"], "complete")
            self.assertEqual(actual["density"]["defects_per_kloc"], 0.0)
            self.assertEqual(actual["density"]["distinct_confirmed_defects"], 0)

    def test_cohort_rejects_sets_duplicates_wrong_head_and_invalid_sha(self):
        invalid = [set(CURRENT_COHORT), [HEAD, HEAD], [PREV, HEAD],
                   [HEAD, "invalid"], [], CURRENT_COHORT + [OLD]]
        for cohort in invalid:
            with self.subTest(cohort=str(cohort)[:80]):
                with self.assertRaisesRegex(ValueError, "ordered, unique"):
                    mod.build_snapshot([], cohort, HEAD, 900)

    def test_incomplete_cohort_retains_counts_without_publishing_a_900_rate(self):
        prior = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900)
        current = mod.build_snapshot([observation("D1")], [HEAD, PREV], HEAD, 900, prior)
        self.assertEqual(current["status"], "incomplete_first_parent_cohort")
        self.assertEqual(current["cohort"]["actual_commits"], 2)
        self.assertEqual(current["density"]["distinct_confirmed_defects"], 1)
        self.assertEqual(current["density"]["unique_path_blob_reviewed_lines"], 100)
        self.assertIsNone(current["density"]["defects_per_kloc"])
        self.assertIsNone(current["density"]["previous_comparable"])
        self.assertIsNone(current["density"]["signed_delta"])
        self.assertEqual(current["comparison"]["reason"], "current_first_parent_cohort_incomplete")

    def test_old_or_missing_cohort_prior_cannot_produce_signed_delta(self):
        original = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900)
        old = copy.deepcopy(original)
        old["schema_version"] = 1
        old["method"] = "first_parent_verified_path_blob_span_union_v1"
        missing = copy.deepcopy(original)
        del missing["cohort"]
        partial = mod.build_snapshot([observation("D1")], [PREV], PREV, 900)
        different_scope = copy.deepcopy(original)
        different_scope["scope"] = "historical_workbook"
        for prior in [old, missing, partial, different_scope]:
            current = mod.build_snapshot([observation("D1")], CURRENT_COHORT, HEAD, 900, prior)
            self.assertEqual(current["freshness"], "prior_not_comparable")
            self.assertEqual(current["comparison"]["status"], "unavailable")
            self.assertIsNone(current["density"]["previous_comparable"])
            self.assertIsNone(current["density"]["signed_delta"])
            self.assertIsNone(current["review"]["new_unique_path_blob_lines_since_prior"])

    def test_altered_cohort_anchors_digest_or_timestamp_reject_comparison(self):
        original = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900)
        alterations = [
            ("cohort", "head_sha", HEAD),
            ("cohort", "oldest_included_sha", HEAD),
            ("cohort", "actual_commits", 899),
            ("cohort", "ordered_shas_sha256", "0" * 64),
            (None, "head", HEAD),
            (None, "captured_utc", "missing timestamp"),
        ]
        for area, key, value in alterations:
            with self.subTest(area=area, key=key):
                prior = copy.deepcopy(original)
                target = prior[area] if area else prior
                target[key] = value
                current = mod.build_snapshot([observation("D1")], CURRENT_COHORT, HEAD, 900, prior)
                self.assertEqual(current["freshness"], "prior_not_comparable")
                self.assertIsNone(current["density"]["signed_delta"])

    def test_shared_head_does_not_hide_different_first_parent_ancestry(self):
        prior = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900)
        rewritten = CURRENT_COHORT.copy()
        rewritten[20], rewritten[21] = rewritten[21], rewritten[20]
        current = mod.build_snapshot([observation("D1")], rewritten, HEAD, 900, prior)
        self.assertEqual(current["comparison"]["reason"], "shared_first_parent_history_mismatch")
        self.assertIsNone(current["density"]["signed_delta"])

    def assert_invalid_prior_evidence(self, prior):
        current = mod.build_snapshot([observation("D1")], CURRENT_COHORT, HEAD, 900, prior)
        self.assertEqual(current["comparison"]["reason"], "prior_evidence_invalid")
        self.assertEqual(current["comparison"]["status"], "unavailable")
        self.assertEqual(current["freshness"], "prior_not_comparable")
        self.assertIsNone(current["density"]["previous_comparable"])
        self.assertIsNone(current["density"]["signed_delta"])
        for name, value in current["review"].items():
            if name.endswith("_since_prior"):
                self.assertIsNone(value, name)

    def test_inconsistent_prior_rate_loc_and_defect_ids_never_generate_deltas(self):
        original = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900)
        mutations = [
            ("density", "defects_per_kloc", 11.0),
            ("density", "defects_per_kloc", float("nan")),
            ("density", "defects_per_kloc", float("inf")),
            ("density", "defects_per_kloc", True),
            ("density", "unique_path_blob_reviewed_lines", 101),
            ("density", "distinct_confirmed_defects", 2),
            ("density", "distinct_confirmed_defects", True),
            ("evidence", "defect_ids", ["D1", "D1"]),
            ("evidence", "defect_ids", [""]),
            ("evidence", "defect_ids", [" "]),
            ("evidence", "defect_ids", []),
            ("evidence", "identities", ["g" * 64]),
            ("evidence", "identities", original["evidence"]["identities"] * 2),
            ("evidence", "fingerprint", "0" * 64),
            ("evidence", "baseline_shas", [HEAD]),
            ("evidence", "files", []),
        ]
        for section, field, value in mutations:
            with self.subTest(section=section, field=field, value=value):
                prior = copy.deepcopy(original)
                prior[section][field] = value
                # A freshly computed envelope digest cannot legitimize bad
                # quantities, malformed IDs, or a mismatched observation hash.
                prior["evidence"]["integrity_sha256"] = mod._evidence_digest(prior["evidence"])
                self.assert_invalid_prior_evidence(prior)

    def test_prior_intervals_must_be_valid_merged_unique_and_counted(self):
        original = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900)
        mutations = [
            [{"path": "src/a.cs", "blob": BLOB, "spans": [[1, 100], [90, 110]]}],
            [{"path": "src/a.cs", "blob": BLOB, "spans": [[1, 50], [51, 100]]}],
            [{"path": "src/a.cs", "blob": BLOB, "spans": [[0, 99]]}],
            [{"path": "src/a.cs", "blob": "bad-blob", "spans": [[1, 100]]}],
            [{"path": "../a.cs", "blob": BLOB, "spans": [[1, 100]]}],
            [{"path": "src/a.cs", "blob": BLOB, "spans": []}],
            original["evidence"]["path_blob_intervals"] * 2,
        ]
        for intervals in mutations:
            with self.subTest(intervals=intervals):
                prior = copy.deepcopy(original)
                prior["evidence"]["path_blob_intervals"] = intervals
                prior["evidence"]["integrity_sha256"] = mod._evidence_digest(prior["evidence"])
                self.assert_invalid_prior_evidence(prior)

    def test_missing_evidence_or_same_count_defect_edit_does_not_reuse_prior_rate(self):
        original = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900)
        edited = copy.deepcopy(original)
        edited["evidence"]["defect_ids"] = ["edited-discovery-id"]
        self.assert_invalid_prior_evidence(edited)
        for section, key in [(None, "evidence"), ("evidence", "identities"),
                             ("evidence", "path_blob_intervals"),
                             ("evidence", "integrity_sha256"), (None, "density")]:
            with self.subTest(section=section, key=key):
                prior = copy.deepcopy(original)
                del (prior[section] if section else prior)[key]
                self.assert_invalid_prior_evidence(prior)

    def test_empty_prior_tracks_new_clean_evidence_without_inventing_previous_rate(self):
        prior = mod.build_snapshot([], PREVIOUS_COHORT, PREV, 900)
        current = mod.build_snapshot([observation(None)], CURRENT_COHORT, HEAD, 900, prior)
        self.assertEqual(prior["status"], "unavailable")
        self.assertEqual(current["comparison"]["status"], "comparable")
        self.assertEqual(current["freshness"], "new_verified_evidence")
        self.assertEqual(current["review"]["new_observations_since_prior"], 1)
        self.assertEqual(current["review"]["new_defects_since_prior"], 0)
        self.assertEqual(current["review"]["new_unique_path_blob_lines_since_prior"], 100)
        self.assertEqual(current["review"]["repeated_line_occurrences_since_prior"], 0)
        self.assertEqual(current["density"]["defects_per_kloc"], 0.0)
        self.assertIsNone(current["density"]["previous_comparable"])
        self.assertIsNone(current["density"]["signed_delta"])

    def test_window_rotation_removes_old_lines_without_claiming_new_review(self):
        rows = [observation("D1", spans=[[1, 20]]),
                observation("D2", path="src/old.cs", spans=[[1, 100]], baseline=OLD)]
        prior = mod.build_snapshot(rows, PREVIOUS_COHORT, PREV, 900)
        current = mod.build_snapshot(rows, CURRENT_COHORT, HEAD, 900, prior)
        self.assertEqual(current["comparison"]["status"], "comparable")
        self.assertEqual(current["comparison"]["rotated_commits"], 1)
        self.assertEqual(current["freshness"], "rolling_window_membership_changed")
        self.assertEqual(current["review"]["new_observations_since_prior"], 0)
        self.assertEqual(current["review"]["removed_unique_path_blob_lines_since_prior"], 100)
        self.assertEqual(current["review"]["new_unique_path_blob_lines_since_prior"], 0)
        self.assertEqual(current["density"]["distinct_confirmed_defects"], 1)
        self.assertEqual(current["density"]["previous_comparable"], 16.666667)
        self.assertEqual(current["density"]["defects_per_kloc"], 50.0)
        self.assertEqual(current["density"]["signed_delta"], 33.333333)

    def test_clean_review_with_overlap_counts_new_and_repeated_lines_and_no_new_defect(self):
        first = observation("D1", spans=[[1, 100]])
        prior = mod.build_snapshot([first], PREVIOUS_COHORT, PREV, 900)
        clean = observation(None, spans=[[91, 150]], baseline=HEAD)
        current = mod.build_snapshot([first, clean], CURRENT_COHORT, HEAD, 900, prior)
        self.assertEqual(current["review"]["new_defects_since_prior"], 0)
        self.assertEqual(current["review"]["new_observations_since_prior"], 1)
        self.assertEqual(current["review"]["new_line_occurrences_since_prior"], 60)
        self.assertEqual(current["review"]["new_unique_path_blob_lines_since_prior"], 50)
        self.assertEqual(current["review"]["repeated_line_occurrences_since_prior"], 10)
        self.assertEqual(current["density"]["distinct_confirmed_defects"], 1)
        self.assertEqual(current["density"]["defects_per_kloc"], 6.666667)
        self.assertEqual(current["density"]["previous_comparable"], 10.0)
        self.assertEqual(current["density"]["signed_delta"], -3.333333)

    def test_clean_rereview_preserves_rate_and_retry_does_not_repeat_measurement(self):
        first = observation("D1")
        prior = mod.build_snapshot([first], PREVIOUS_COHORT, PREV, 900)
        clean = observation(None, baseline=HEAD)
        current = mod.build_snapshot([first, clean, clean], CURRENT_COHORT, HEAD, 900, prior)
        self.assertEqual(current["review"]["new_defects_since_prior"], 0)
        self.assertEqual(current["review"]["new_observations_since_prior"], 1)
        self.assertEqual(current["review"]["new_unique_path_blob_lines_since_prior"], 0)
        self.assertEqual(current["review"]["new_line_occurrences_since_prior"], 100)
        self.assertEqual(current["review"]["repeated_line_occurrences_since_prior"], 100)
        self.assertEqual(current["density"]["defects_per_kloc"], 10.0)
        self.assertEqual(current["density"]["signed_delta"], 0.0)

    def test_first_snapshot_has_no_invented_prior_or_signed_delta(self):
        row = observation("D1")
        result = mod.build_snapshot([row], CURRENT_COHORT, HEAD, 900)
        self.assertEqual(result["status"], "source_verified_subset")
        self.assertEqual(result["freshness"], "no_prior_snapshot")
        self.assertEqual(result["density"]["defects_per_kloc"], 10.0)
        self.assertIsNone(result["density"]["previous_comparable"])
        self.assertIsNone(result["density"]["signed_delta"])

    def test_no_new_evidence_is_explicitly_stale_even_when_head_changes(self):
        row = observation("D1")
        before = mod.build_snapshot([row], PREVIOUS_COHORT, PREV, 900)
        after = mod.build_snapshot([row], CURRENT_COHORT, HEAD, 900, before)
        self.assertEqual(after["freshness"], "stale_no_new_verified_evidence")
        self.assertEqual(after["review"]["new_observations_since_prior"], 0)
        self.assertEqual(after["review"]["new_unique_path_blob_lines_since_prior"], 0)
        self.assertEqual(after["density"]["signed_delta"], 0.0)
        self.assertEqual(after["density"]["previous_comparable"], 10.0)

    def test_new_defect_and_lines_generate_fresh_snapshot_and_signed_delta(self):
        first = observation("D1")
        baseline = mod.build_snapshot([first], PREVIOUS_COHORT, PREV, 900)
        second = observation("D2", path="src/b.cs", spans=[[1, 50]])
        update = mod.build_snapshot([first, second], CURRENT_COHORT, HEAD, 900, baseline)
        self.assertEqual(update["freshness"], "new_verified_evidence")
        self.assertEqual(update["review"]["new_defects_since_prior"], 1)
        self.assertEqual(update["review"]["new_files_since_prior"], 1)
        self.assertEqual(update["review"]["new_observations_since_prior"], 1)
        self.assertEqual(update["review"]["new_unique_path_blob_lines_since_prior"], 50)
        self.assertEqual(update["density"]["unique_path_blob_reviewed_lines"], 150)
        self.assertEqual(update["density"]["defects_per_kloc"], 13.333333)
        self.assertEqual(update["density"]["signed_delta"], 3.333333)

    def test_overlapping_spans_same_blob_are_not_double_counted(self):
        rows = [observation("D1", spans=[[1, 10]]),
                observation("D2", spans=[[5, 15]]),
                observation("D2", spans=[[5, 15]])]
        result = mod.build_snapshot(rows, CURRENT_COHORT, HEAD, 900)
        self.assertEqual(result["density"]["distinct_confirmed_defects"], 2)
        self.assertEqual(result["review"]["distinct_verified_observations"], 2)
        self.assertEqual(result["density"]["unique_path_blob_reviewed_lines"], 15)

    def test_new_reviewed_lines_are_deduplicated_against_prior_spans(self):
        initial = observation("D1", spans=[[1, 20]])
        prior = mod.build_snapshot([initial], PREVIOUS_COHORT, PREV, 900)
        additional = observation("D2", spans=[[15, 30]])
        current = mod.build_snapshot([initial, additional], CURRENT_COHORT, HEAD, 900, prior)
        self.assertEqual(current["density"]["unique_path_blob_reviewed_lines"], 30)
        self.assertEqual(current["review"]["new_unique_path_blob_lines_since_prior"], 10)
        self.assertEqual(current["review"]["new_files_since_prior"], 0)

    def test_duplicate_source_evidence_never_claims_new_reviewed_lines(self):
        item = observation("D1", spans=[[1, 100]])
        prior = mod.build_snapshot([item], PREVIOUS_COHORT, PREV, 900)
        current = mod.build_snapshot([item, item], CURRENT_COHORT, HEAD, 900, prior)
        self.assertEqual(current["freshness"], "stale_no_new_verified_evidence")
        self.assertEqual(current["review"]["new_unique_path_blob_lines_since_prior"], 0)

    def test_unverified_and_outside_first_parent_window_excluded(self):
        result = mod.build_snapshot([
            observation("D1", verified=False),
            observation("D2", baseline=OLD),
        ], CURRENT_COHORT, HEAD, 900)
        self.assertEqual(result["status"], "unavailable")
        self.assertIsNone(result["density"]["defects_per_kloc"])
        self.assertEqual(result["review"]["unverified_rows_excluded"], 1)

    def test_prior_window_or_method_mismatch_prohibits_comparison(self):
        first = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT[:800], PREV, 800)
        after = mod.build_snapshot([observation("D1")], CURRENT_COHORT, HEAD, 900, first)
        self.assertEqual(after["freshness"], "prior_not_comparable")
        self.assertIsNone(after["density"]["signed_delta"])

    def test_changed_history_membership_does_not_masquerade_as_new_review(self):
        first = mod.build_snapshot([observation("D1", baseline=OLD)],
                                   PREVIOUS_COHORT, PREV, 900)
        current = mod.build_snapshot([observation("D1", baseline=OLD)],
                                     CURRENT_COHORT, HEAD, 900, first)
        self.assertEqual(current["freshness"], "rolling_window_membership_changed")
        self.assertIsNone(current["density"]["signed_delta"])

    def test_revalidate_rejects_false_verified_flag_when_git_blob_differs(self):
        with patch.object(mod, "verified_observation", return_value={"blob": HEAD}):
            with self.assertRaisesRegex(ValueError, "Pinned source blob mismatch"):
                mod.revalidate_rows(Path("."), [observation("D1")], {PREV})

    def test_revalidate_does_not_promote_candidates(self):
        with patch.object(mod, "verified_observation") as validate:
            result = mod.revalidate_rows(Path("."), [observation("D1", verified=False)], {PREV})
        self.assertEqual(result, [])
        validate.assert_not_called()

    def test_duplicate_recorded_rows_do_not_change_fingerprint(self):
        item = observation("D1")
        one = mod.build_snapshot([item], PREVIOUS_COHORT, PREV, 900)
        repeated = mod.build_snapshot([item, item], CURRENT_COHORT, HEAD, 900, one)
        self.assertEqual(repeated["freshness"], "stale_no_new_verified_evidence")

    def test_historical_checkpoint_is_visible_without_changing_subset_numerator(self):
        with patch.object(mod, "read_historical_checkpoint", return_value={
            "status": "historical_workbook_partial_checkpoint_not_current",
            "all_history_review_observations": 5741,
            "clean_reviews": 4864,
            "known_all_history_incremental_loc_sum_not_window_union": 402314,
            "missing_incremental_loc_observations": 30,
            "latest_legacy_900_window": {
                "defects": 463, "unique_loc": 343492,
                "per_kloc": 1000 * 463 / 343492,
                "as_of_et": "November 22, 2026 9:43 AM EST",
            },
        }):
            legacy = mod.read_historical_checkpoint(Path("ignored"))
            snapshot = mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900)
            before = snapshot["density"]["unique_path_blob_reviewed_lines"]
            snapshot["historical_checkpoint"] = legacy
            report = mod.markdown(snapshot)
            self.assertIn("343,492 reviewed LOC", report)
            self.assertIn("5,741", report)
            self.assertIn("4,864", report)
            self.assertIn("not** a current", report)
            self.assertEqual(snapshot["density"]["unique_path_blob_reviewed_lines"], before)

    def test_snapshot_is_explicitly_not_comparable_to_legacy_spreadsheet(self):
        report = mod.markdown(mod.build_snapshot([observation("D1")], PREVIOUS_COHORT, PREV, 900))
        self.assertIn("Not comparable to the historical workbook checkpoint", report)
        self.assertIn("no_prior_snapshot", report)


if __name__ == "__main__":
    unittest.main()
