"""Fail-closed provisional cross-revision candidates; never promote to LOC."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256
import aspects_reconcile_candidate_lineage as sut


def git(path, *args):
    return subprocess.check_output(["git", "-C", str(path), *args], text=True).strip()


class CandidateLineageTests(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.repo = Path(t.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.email", "test@example.invalid")
        git(self.repo, "config", "user.name", "Test")
        self.commit("alpha\nunique\nrepeat\nrepeat\n", "old")
        self.old_sha = git(self.repo, "rev-parse", "HEAD")
        self.old_blob = git(self.repo, "rev-parse", "HEAD:a.cs")
        self.commit("alpha\nunique\nrepeat\nrepeat\nnovel\n", "new")
        self.new_sha = git(self.repo, "rev-parse", "HEAD")
        self.new_blob = git(self.repo, "rev-parse", "HEAD:a.cs")
        self.anchor = {"status": "verified_first_parent_sha_membership",
                       "head_sha": self.new_sha, "oldest_sha": self.old_sha,
                       "first_parent_commits": 2}

    def commit(self, source, message):
        (self.repo / "a.cs").write_text(source)
        git(self.repo, "add", "a.cs")
        git(self.repo, "commit", "-qm", message)

    def fixture(self):
        pinned = [{
            "excel_row": 7, "reviewed_master_sha": self.old_sha,
            "pin_status": VERIFIED, "window_membership": "in_window",
            "path": "a.cs", "blob": self.old_blob,
            "spans": [[1, 4]], "nonblank_reviewed_loc": 4,
        }]
        candidates = [{
            "excel_row": 8, "reviewed_master_sha": self.new_sha,
            "status": "git_source_at_review_commit_candidate_only",
            "original_blob_pinned": False,
            "window_membership": "in_900_first_parent_window",
            "candidate_nonblank_loc": 5,
            "sources": [{
                "path": "a.cs", "blob_derived_at_reviewed_commit": self.new_blob,
                "original_blob_pinned": False, "nonblank_loc": 5,
                "nonblank_intervals_at_reviewed_commit": [[1, 5]],
            }],
        }]
        pinned.append({
            "excel_row": 8, "reviewed_master_sha": self.new_sha,
            "pin_status": "unparseable", "window_membership": "in_window",
        })
        pin_report = {"audited_rows_sha256": audited_rows_sha256(pinned),
                      "first_parent_checkpoint": self.anchor,
                      "review_events_present": 2}
        candidate_report = {
            "candidate_rows_sha256": audited_rows_sha256(candidates),
            "first_parent_checkpoint": self.anchor,
            "unparsed_historical_rows_examined": 1,
            "candidate_rows": 1, "candidate_line_occurrences": 5,
            "in_window_candidate_rows": 1,
            "in_window_candidate_line_occurrences": 5,
        }
        return pinned, pin_report, candidates, candidate_report

    def case(self, mutate=None, cap=4000):
        data = self.fixture()
        if mutate:
            mutate(*data)
        return sut.candidate_lineage(self.repo, *data, expected_records=2,
                                     max_blob_lines=cap)

    def test_two_unique_lines_map_provisionally_but_repeated_text_does_not(self):
        r = self.case()
        self.assertEqual(r["status"], "provisional_cross_revision_candidate_lineage")
        self.assertEqual(r["candidate_exact_only_line_identities"], 5)
        self.assertEqual(r["candidate_only_matching_unique_unchanged_text_in_nearby_original_pins"], 2)
        self.assertEqual(r["candidate_only_remaining_without_such_match"], 3)
        self.assertEqual(r["candidate_only_matching_adjacent_first_parent_unchanged_unique_lines"], 2)
        self.assertEqual(r["candidate_only_proven_same_path_first_parent_lineage_to_original_pin"], 2)
        self.assertEqual(r["candidate_only_provisional_equal_hunk_without_full_first_parent_proof"], 0)
        self.assertEqual(r["derived_git_tree_source_components_attested"], 1)
        self.assertEqual(r["derived_git_tree_nonblank_occurrences_attested"], 5)
        self.assertEqual(r["new_original_pin_verified_loc"], 0)
        self.assertIsNone(r["new_comparable_900_density"])

    def test_source_proof_keeps_original_excel_identity_and_zero_reviewed_loc(self):
        r = self.case()
        entries = r["candidate_review_source_lineage_by_excel_row"]
        self.assertEqual(len(entries), 1)
        row = entries[0]
        self.assertEqual(row["excel_row"], 8)
        self.assertEqual(row["reviewed_master_sha"], self.new_sha)
        self.assertEqual(row["candidate_source_line_occurrences"], 5)
        self.assertEqual(row["source_paths_reported"], ["a.cs"])
        self.assertEqual(row["source_paths_with_original_pinned_review"], ["a.cs"])
        self.assertEqual(row["source_paths_without_original_pinned_review"], [])
        self.assertEqual(row["candidate_line_occurrences_on_paths_with_original_pins"], 5)
        self.assertEqual(row["candidate_line_occurrences_on_paths_without_original_pins"], 0)
        self.assertEqual(row["exact_repeat_with_original_pin_same_path_blob_line"], 0)
        self.assertEqual(row["different_blob_full_first_parent_proven_repeat_with_original_pin"], 2)
        self.assertEqual(row["different_blob_provisional_equal_hunk_only"], 0)
        self.assertEqual(row["without_proven_original_pin_identity"], 3)
        self.assertEqual(row["newly_independently_verified_reviewed_loc"], 0)
        self.assertTrue(r["candidate_row_lineage_proof_not_reviewed_loc"])

    def test_candidate_source_with_no_same_path_original_pin_is_not_assumed_new_review(self):
        (self.repo / "unreviewed.cs").write_text(
            "extra-a\nextra-b\n", encoding="utf-8")
        git(self.repo, "add", "unreviewed.cs")
        git(self.repo, "commit", "-qm", "extra explicit candidate-only source")
        current = git(self.repo, "rev-parse", "HEAD")
        extra_blob = git(self.repo, "rev-parse", "HEAD:unreviewed.cs")
        def add_path(pins, pin_report, candidates, candidate_report):
            pins[1]["reviewed_master_sha"] = current
            row = candidates[0]
            row["reviewed_master_sha"] = current
            row["candidate_nonblank_loc"] = 7
            row["sources"].append({
                "path": "unreviewed.cs",
                "blob_derived_at_reviewed_commit": extra_blob,
                "original_blob_pinned": False,
                "nonblank_loc": 2,
                "nonblank_intervals_at_reviewed_commit": [[1, 2]],
            })
            self.anchor["head_sha"] = current
            self.anchor["first_parent_commits"] = 3
            pin_report["audited_rows_sha256"] = audited_rows_sha256(pins)
            candidate_report["candidate_rows_sha256"] = audited_rows_sha256(candidates)
            candidate_report["candidate_line_occurrences"] = 7
            candidate_report["in_window_candidate_line_occurrences"] = 7
        result = self.case(add_path)
        self.assertEqual(result["status"], "provisional_cross_revision_candidate_lineage")
        review = result["candidate_review_source_lineage_by_excel_row"][0]
        self.assertEqual(review["source_paths_reported"], ["a.cs", "unreviewed.cs"])
        self.assertEqual(review["source_paths_with_original_pinned_review"], ["a.cs"])
        self.assertEqual(review["source_paths_without_original_pinned_review"],
                         ["unreviewed.cs"])
        self.assertEqual(review["candidate_source_line_occurrences"], 7)
        self.assertEqual(review["candidate_line_occurrences_on_paths_with_original_pins"], 5)
        self.assertEqual(review["candidate_line_occurrences_on_paths_without_original_pins"], 2)
        self.assertEqual(review["newly_independently_verified_reviewed_loc"], 0)
        self.assertIsNone(result["new_comparable_900_density"])

    def test_original_blob_pin_only_proves_lines_reviewed_at_its_own_commit(self):
        # At the old commit only alpha was reviewed. The later review of
        # "unique" references the SAME blob after an intervening mutation
        # and reversion. A candidate line at the middle SHA must not inherit
        # the early source blob's uninterrupted history for the later review.
        self.commit("alpha\\nmutated\\nrepeat\\nrepeat\\nnovel\\n",
                    "mutate before later reviewed pin")
        self.commit("alpha\\nunique\\nrepeat\\nrepeat\\n",
                    "restore old blob for later original pin")
        restored_sha = git(self.repo, "rev-parse", "HEAD")
        self.assertEqual(git(self.repo, "rev-parse", "HEAD:a.cs"), self.old_blob)
        pinned, pin_report, candidates, candidate_report = self.fixture()
        pinned[0]["spans"] = [[1, 1]]
        pinned[0]["nonblank_reviewed_loc"] = 1
        pinned.append({
            "excel_row": 9, "reviewed_master_sha": restored_sha,
            "pin_status": VERIFIED, "window_membership": "in_window",
            "path": "a.cs", "blob": self.old_blob,
            "spans": [[2, 2]], "nonblank_reviewed_loc": 1,
        })
        self.anchor["head_sha"] = restored_sha
        self.anchor["first_parent_commits"] = 4
        pin_report["audited_rows_sha256"] = audited_rows_sha256(pinned)
        pin_report["review_events_present"] = 3
        result = sut.candidate_lineage(self.repo, pinned, pin_report, candidates,
                                       candidate_report, expected_records=3)
        self.assertEqual(result["status"], "provisional_cross_revision_candidate_lineage")
        self.assertEqual(result["original_source_pin_review_commit_anchors"], 2)
        self.assertEqual(result["candidate_only_proven_same_path_first_parent_lineage_to_original_pin"], 1)
        review = result["candidate_review_source_lineage_by_excel_row"][0]
        self.assertEqual(review["different_blob_full_first_parent_proven_repeat_with_original_pin"], 1)
        self.assertEqual(review["different_blob_provisional_equal_hunk_only"], 1)
        self.assertEqual(review["without_proven_original_pin_identity"], 4)
        self.assertEqual(review["newly_independently_verified_reviewed_loc"], 0)

    def test_cohort_proof_is_not_reused_for_later_review_of_reverted_same_blob(self):
        self.commit("alpha\\nmutated\\nrepeat\\nrepeat\\nnovel\\n",
                    "intermediate changed line")
        self.commit("alpha\\nunique\\nrepeat\\nrepeat\\nnovel\\n",
                    "restore identical candidate blob")
        reverted_sha = git(self.repo, "rev-parse", "HEAD")
        self.assertEqual(git(self.repo, "rev-parse", "HEAD:a.cs"), self.new_blob)
        pinned, pin_report, candidates, candidate_report = self.fixture()
        pinned.append({
            "excel_row": 9, "reviewed_master_sha": reverted_sha,
            "pin_status": "unparseable", "window_membership": "in_window",
        })
        later = dict(candidates[0])
        later["excel_row"] = 9
        later["reviewed_master_sha"] = reverted_sha
        later["sources"] = [dict(source) for source in candidates[0]["sources"]]
        candidates.append(later)
        self.anchor["head_sha"] = reverted_sha
        self.anchor["first_parent_commits"] = 4
        pin_report["audited_rows_sha256"] = audited_rows_sha256(pinned)
        pin_report["review_events_present"] = 3
        candidate_report["candidate_rows_sha256"] = audited_rows_sha256(candidates)
        candidate_report["unparsed_historical_rows_examined"] = 2
        candidate_report["candidate_rows"] = 2
        candidate_report["in_window_candidate_rows"] = 2
        candidate_report["candidate_line_occurrences"] = 10
        candidate_report["in_window_candidate_line_occurrences"] = 10
        result = sut.candidate_lineage(self.repo, pinned, pin_report, candidates,
                                       candidate_report, expected_records=3)
        self.assertEqual(result["status"], "provisional_cross_revision_candidate_lineage")
        reviews = {r["excel_row"]: r for r in
                   result["candidate_review_source_lineage_by_excel_row"]}
        self.assertEqual(reviews[8]["different_blob_full_first_parent_proven_repeat_with_original_pin"], 2)
        self.assertEqual(reviews[8]["cohort_lineage_proof_not_retraced_at_this_review_commit"], 0)
        self.assertEqual(reviews[9]["different_blob_full_first_parent_proven_repeat_with_original_pin"], 0)
        self.assertEqual(reviews[9]["cohort_lineage_proof_not_retraced_at_this_review_commit"], 2)
        self.assertEqual(reviews[9]["different_blob_provisional_equal_hunk_only"], 2)
        self.assertEqual(reviews[9]["without_proven_original_pin_identity"], 5)
        self.assertEqual(reviews[9]["newly_independently_verified_reviewed_loc"], 0)

    def test_edit_revert_row_proof_does_not_count_unstable_text(self):
        self.commit("alpha\\nmutated\\nrepeat\\nrepeat\\nnovel\\n", "middle mutation")
        self.commit("alpha\\nunique\\nrepeat\\nrepeat\\nnovel\\n", "text restored")
        current = git(self.repo, "rev-parse", "HEAD")
        def relocate(pins, pin_report, candidates, candidate_report):
            pins[1]["reviewed_master_sha"] = current
            candidates[0]["reviewed_master_sha"] = current
            self.anchor["head_sha"] = current
            self.anchor["first_parent_commits"] = 4
            pin_report["audited_rows_sha256"] = audited_rows_sha256(pins)
            candidate_report["candidate_rows_sha256"] = audited_rows_sha256(candidates)
        r = self.case(relocate)
        row = r["candidate_review_source_lineage_by_excel_row"][0]
        self.assertEqual(row["candidate_source_line_occurrences"], 5)
        self.assertEqual(row["different_blob_full_first_parent_proven_repeat_with_original_pin"], 1)
        self.assertEqual(row["different_blob_provisional_equal_hunk_only"], 1)
        self.assertEqual(row["newly_independently_verified_reviewed_loc"], 0)

    def test_derived_blob_at_wrong_review_commit_fails_even_with_matching_digest(self):
        def mutate(pin, pr, cand, cr):
            cand[0]["sources"][0]["path"] = "other.cs"
            cr["candidate_rows_sha256"] = audited_rows_sha256(cand)
        result = self.case(mutate)
        self.assertEqual(result["status"], "blocked_on_evidence")
        self.assertIn("Git tree at reported review commit", result["blocking_reason"])

    def test_nonadjacent_equal_lines_remain_provisional_not_adjacent(self):
        git(self.repo, "commit", "--allow-empty", "-qm", "intervening first-parent commit")
        current = git(self.repo, "rev-parse", "HEAD")
        def mutate(pin, pr, cand, cr):
            pin[1]["reviewed_master_sha"] = current
            cand[0]["reviewed_master_sha"] = current
            self.anchor["head_sha"] = current
            self.anchor["first_parent_commits"] = 3
            pr["audited_rows_sha256"] = audited_rows_sha256(pin)
            cr["candidate_rows_sha256"] = audited_rows_sha256(cand)
        result = self.case(mutate)
        self.assertEqual(result["status"], "provisional_cross_revision_candidate_lineage")
        self.assertEqual(result["candidate_only_matching_unique_unchanged_text_in_nearby_original_pins"], 2)
        self.assertEqual(result["candidate_only_matching_adjacent_first_parent_unchanged_unique_lines"], 0)
        self.assertEqual(result["candidate_only_proven_same_path_first_parent_lineage_to_original_pin"], 2)

    def test_missing_chain_fails_closed(self):
        def mutate(pin, pr, cand, cr):
            pr["first_parent_checkpoint"]["oldest_sha"] = "f" * 40
            cr["first_parent_checkpoint"]["oldest_sha"] = "f" * 40
        r = self.case(mutate)
        self.assertEqual(r["status"], "blocked_on_evidence")
        self.assertIn("chain", r["blocking_reason"])

    def test_mismatched_derived_audit_fails_closed(self):
        def mutate(pin, pr, cand, cr):
            cand[0]["sources"][0]["nonblank_loc"] = 99
        r = self.case(mutate)
        self.assertIn("SHA-256", r["blocking_reason"])

    def test_quadratic_cap_retains_only_safe_unique_boundary_lines(self):
        r = self.case(cap=1)
        self.assertEqual(r["candidate_only_matching_unique_unchanged_text_in_nearby_original_pins"], 2)
        self.assertEqual(r["bounded_unique_prefix_suffix_revision_pairs_examined"], 1)
        self.assertEqual(r["candidate_original_revision_pairs_skipped"], 0)
        self.assertEqual(r["new_original_pin_verified_loc"], 0)


    def test_intervening_mutation_and_revert_does_not_prove_same_line(self):
        self.commit("alpha\nmutated\nrepeat\nrepeat\nnovel\n", "middle modification")
        self.commit("alpha\nunique\nrepeat\nrepeat\nnovel\n", "restore text")
        current = git(self.repo, "rev-parse", "HEAD")
        def mutate(pin, pr, cand, cr):
            pin[1]["reviewed_master_sha"] = current
            cand[0]["reviewed_master_sha"] = current
            self.anchor["head_sha"] = current
            self.anchor["first_parent_commits"] = 4
            pr["audited_rows_sha256"] = audited_rows_sha256(pin)
            cr["candidate_rows_sha256"] = audited_rows_sha256(cand)
        r = self.case(mutate)
        self.assertEqual(r["status"], "provisional_cross_revision_candidate_lineage")
        self.assertEqual(r["candidate_only_matching_unique_unchanged_text_in_nearby_original_pins"], 2)
        self.assertEqual(r["candidate_only_proven_same_path_first_parent_lineage_to_original_pin"], 1)
        self.assertEqual(r["candidate_only_provisional_equal_hunk_without_full_first_parent_proof"], 1)

    def test_path_deletion_then_recreation_blocks_lineage(self):
        git(self.repo, "rm", "-q", "a.cs")
        git(self.repo, "commit", "-qm", "delete path")
        self.commit("alpha\nunique\nrepeat\nrepeat\nnovel\n", "recreate path")
        current = git(self.repo, "rev-parse", "HEAD")
        def mutate(pin, pr, cand, cr):
            pin[1]["reviewed_master_sha"] = current
            cand[0]["reviewed_master_sha"] = current
            self.anchor["head_sha"] = current
            self.anchor["first_parent_commits"] = 4
            pr["audited_rows_sha256"] = audited_rows_sha256(pin)
            cr["candidate_rows_sha256"] = audited_rows_sha256(cand)
        r = self.case(mutate)
        self.assertEqual(r["candidate_only_proven_same_path_first_parent_lineage_to_original_pin"], 0)
        self.assertEqual(r["first_parent_lineage_skipped_reasons"]["missing_intermediate_path"], 1)


class LongFirstParentLineageTests(unittest.TestCase):
    """Long unchanged gaps must be examined edge by edge, not guessed."""

    @staticmethod
    def trace(*, mutate_and_revert=False, max_edges=128):
        from aspects_verify_first_parent_lineage import trace_unique_first_parent_lines
        shas = [f"{i:040x}" for i in range(41)]
        old, new, mutation = "a" * 40, "b" * 40, "c" * 40
        blobs = [old] * 40 + [new]
        if mutate_and_revert:
            blobs[20] = mutation
        positions = dict(zip(shas, blobs))
        contents = {
            old: ["unique", "stable"],
            new: ["unique", "stable", "additional"],
            mutation: ["modified", "stable"],
        }
        return trace_unique_first_parent_lines(
            shas, "a.cs", old, 0, new, 40, {1, 2},
            lambda sha, path: positions[sha] if path == "a.cs" else None,
            lambda blob: contents.get(blob), max_edges=max_edges,
        )

    def test_40_parent_edges_prove_unchanged_unique_lines(self):
        mapped, reason, edges = self.trace()
        self.assertEqual(mapped, {1: 1, 2: 2})
        self.assertIsNone(reason)
        self.assertEqual(edges, 40)

    def test_modified_then_restored_line_stays_unproven(self):
        mapped, reason, edges = self.trace(mutate_and_revert=True)
        self.assertEqual(mapped, {2: 2})
        self.assertIsNone(reason)
        self.assertEqual(edges, 40)

    def test_shorter_explicit_cap_fails_closed(self):
        mapped, reason, edges = self.trace(max_edges=16)
        self.assertEqual(mapped, {})
        self.assertEqual(reason, "distance_cap")
        self.assertEqual(edges, 40)



class SparseGitFirstParentLineageTests(unittest.TestCase):
    """Sparse path history must see edits-and-reverts beyond the old 128 cap."""

    def test_130_edge_gap_uses_real_git_change_index_and_detects_reversion(self):
        from aspects_verify_first_parent_lineage import (
            git_verified_changed_first_parent_orders, trace_unique_first_parent_lines)
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            git(repo, "init", "-q")
            git(repo, "config", "user.email", "test@example.invalid")
            git(repo, "config", "user.name", "Test")
            shas = []
            blobs = {}
            for i in range(131):
                if i == 0:
                    source = "unique\nstable\n"
                elif i == 40:
                    source = "mutated\nstable\n"
                elif i == 41:
                    source = "unique\nstable\n"
                elif i == 100:
                    source = "unique\nstable\nnew\n"
                (repo / "a.cs").write_text(source, encoding="utf-8")
                git(repo, "add", "a.cs")
                git(repo, "commit", "--allow-empty", "-qm", f"commit {i}")
                sha = git(repo, "rev-parse", "HEAD")
                shas.append(sha)
                blobs[sha] = git(repo, "rev-parse", "HEAD:a.cs")
            changed, error = git_verified_changed_first_parent_orders(
                repo, shas, "a.cs", 0, 130)
            self.assertIsNone(error)
            self.assertEqual(changed, {40, 41, 100})
            tree_blob = lambda sha, path: blobs[sha] if path == "a.cs" else None
            source_lines = lambda blob: git(repo, "show", blob).splitlines()
            dense, dense_error, _ = trace_unique_first_parent_lines(
                shas, "a.cs", blobs[shas[0]], 0, blobs[shas[-1]], 130,
                {1, 2}, tree_blob, source_lines)
            self.assertEqual(dense, {})
            self.assertEqual(dense_error, "distance_cap")
            traced, reason, edges = trace_unique_first_parent_lines(
                shas, "a.cs", blobs[shas[0]], 0, blobs[shas[-1]], 130,
                {1, 2}, tree_blob, source_lines, changed_orders=changed)
            self.assertIsNone(reason)
            self.assertEqual(edges, 130)
            self.assertEqual(traced, {2: 2})
            # A missing path is never accepted as an invented empty history.
            missing, missing_error = git_verified_changed_first_parent_orders(
                repo, shas, "does-not-exist.cs", 0, 130)
            self.assertIsNone(missing_error)
            self.assertEqual(missing, set())
            self.assertEqual(
                trace_unique_first_parent_lines(
                    shas, "does-not-exist.cs", blobs[shas[0]], 0,
                    blobs[shas[-1]], 130, {1}, tree_blob, source_lines,
                    changed_orders=missing)[1],
                "review_commit_tree_mismatch")


class BoundedLargeFileTests(unittest.TestCase):
    def test_middle_edit_not_inferred_for_large_blob(self):
        from aspects_verify_first_parent_lineage import bounded_unique_unchanged_pairs
        old = ["head"] + [f"line-{i}" for i in range(2500)] + ["tail"]
        new = old.copy()
        new[1200] = "changed-middle"
        mapped, strategy = bounded_unique_unchanged_pairs(old, new)
        self.assertEqual(strategy, "unique_prefix_suffix_only")
        self.assertEqual(mapped[1], 1)
        self.assertEqual(mapped[len(old)], len(new))
        self.assertNotIn(1201, mapped)
        self.assertEqual(len(mapped), len(old) - 1)

    def test_duplicate_boundary_text_is_excluded(self):
        from aspects_verify_first_parent_lineage import bounded_unique_unchanged_pairs
        old = ["repeat", "repeat", "stable", "changed", "tail"]
        new = ["repeat", "repeat", "stable", "replacement", "tail"]
        mapped, strategy = bounded_unique_unchanged_pairs(
            old, new, max_blob_lines=1)
        self.assertEqual(strategy, "unique_prefix_suffix_only")
        self.assertEqual(mapped, {3: 3, 5: 5})

    def test_linear_hard_cap_fails_closed(self):
        from aspects_verify_first_parent_lineage import bounded_unique_unchanged_pairs
        mapped, reason = bounded_unique_unchanged_pairs(
            ["A"] * 101, ["A"] * 101,
            max_blob_lines=1, max_linear_blob_lines=100)
        self.assertIsNone(mapped)
        self.assertEqual(reason, "complexity_cap")

    def test_large_edge_proves_only_unchanged_boundaries(self):
        from aspects_verify_first_parent_lineage import trace_unique_first_parent_lines
        old = ["head"] + [f"line-{i}" for i in range(2500)] + ["tail"]
        new = old.copy()
        new[1200] = "changed-middle"
        sha1, sha2 = "a" * 40, "b" * 40
        traced, reason, edges = trace_unique_first_parent_lines(
            [sha1, sha2], "a.cs", "old", 0, "new", 1,
            {1, 1201, 2502},
            lambda sha, path: "old" if sha == sha1 else "new",
            lambda blob: {"old": old, "new": new}[blob],
            changed_orders={1})
        self.assertIsNone(reason)
        self.assertEqual(edges, 1)
        self.assertEqual(traced, {1: 1, 2502: 2502})


if __name__ == "__main__":
    unittest.main()
