"""Goldens for provenance-safe recovery of historical unpinned review candidates."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import aspects_recover_unpinned_historical_sources as sut


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()


class UnpinnedRecoveryTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.repo = Path(tmp.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.email", "aspects@example.invalid")
        git(self.repo, "config", "user.name", "Aspects")
        (self.repo / "src").mkdir()
        (self.repo / "src/a.cs").write_text("one\n\ntwo\n", encoding="utf-8")
        (self.repo / "src/b.cs").write_text("bee\n", encoding="utf-8")
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "first")
        self.head = git(self.repo, "rev-parse", "HEAD")
        self.checkpoint = {"head_sha": self.head,
                           "oldest_included_sha": self.head,
                           "window_first_parent_commits": 1}

    def row(self, excel, raw, loc, sha=None):
        return {"excel_row": excel, "review_id": f"review-{excel}",
                "reviewed_master_sha": sha or self.head,
                "parsed_pin": None, "reviewed_file_spans_raw": raw,
                "reviewed_loc_reported": loc, "defects_recorded": 0}

    def commit_source_bytes(self, payload):
        (self.repo / "src/a.cs").write_bytes(payload)
        git(self.repo, "add", "src/a.cs")
        git(self.repo, "commit", "-qm", "source encoding fixture")
        self.head = git(self.repo, "rev-parse", "HEAD")
        self.checkpoint.update(head_sha=self.head, oldest_included_sha=self.head)

    def test_commit_derived_single_source_preserves_original_provenance(self):
        report, rows = sut.recover(self.repo, [
            self.row(247, "src/a.cs 1–3.", 2)], self.checkpoint)
        self.assertEqual(report["candidate_rows"], 1)
        self.assertEqual(report["candidate_line_occurrences"], 2)
        self.assertEqual(report["in_window_candidate_rows"], 1)
        self.assertIsNone(report["historical_900_density_recomputed"])
        self.assertFalse(report["included_in_verified_pin_denominator"])
        self.assertEqual(rows[0]["status"], "git_source_at_review_commit_candidate_only")
        self.assertFalse(rows[0]["original_blob_pinned"])
        self.assertEqual(rows[0]["sources"][0]["nonblank_intervals_at_reviewed_commit"],
                         [[1, 1], [3, 3]])
        self.assertEqual(rows[0]["sources"][0]["blob_derived_at_reviewed_commit"],
                         git(self.repo, "rev-parse", "HEAD:src/a.cs"))

    def test_clean_replay_is_separate_and_deduplicated_within_candidate_scope(self):
        report, rows = sut.recover(self.repo, [
            self.row(247, "src/a.cs 1–3.", 2),
            self.row(248, "src/a.cs 1–3.", 2)], self.checkpoint)
        self.assertEqual(report["candidate_rows"], 2)
        self.assertEqual(report["candidate_line_occurrences"], 4)
        self.assertEqual(report["candidate_new_exact_path_blob_loc"], 2)
        self.assertEqual(report["candidate_repeated_exact_path_blob_loc"], 2)
        self.assertEqual(rows[1]["candidate_repeated_exact_path_blob_loc"], 2)

    def test_missing_blob_not_guessed_from_basename_or_narrative(self):
        report, rows = sut.recover(self.repo, [
            self.row(7, "a.cs 1–3.", 2),
            self.row(8, "Reviewed spans (inclusive): a.cs 1–3.", 2),
            self.row(9, "src/a.cs [blob " + "f" * 40 + "] 1–3", 2),
            self.row(10, "src/../src/a.cs 1–3", 2)], self.checkpoint)
        self.assertEqual(report.get("candidate_rows", 0), 0)
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[2]["status"], "original_multi_blob_pins_deferred_to_main_audit")

    def test_complete_multi_file_recovery_is_atomic_and_checks_nonblank_total(self):
        good = self.row(300, "src/a.cs 1–3; src/b.cs 1–1", 3)
        report, audited = sut.recover(self.repo, [
            good,
            self.row(301, "src/a.cs 1–3; src/missing.cs 1–1", 3),
            self.row(302, "src/a.cs 1–3; src/b.cs 1–1", 4),
        ], self.checkpoint)
        self.assertEqual(report["candidate_rows"], 1)
        self.assertEqual(report["candidate_line_occurrences"], 3)
        self.assertEqual(audited[1]["status"], "commit_path_unavailable")
        self.assertEqual(audited[2]["status"], "workbook_nonblank_loc_mismatch")
        self.assertEqual(audited[1]["candidate_nonblank_loc"], 0)
        self.assertEqual(audited[2]["candidate_nonblank_loc"], 0)

    def test_duplicate_explicit_full_path_fragments_coalesce_within_one_review(self):
        raw = ("src/a.cs 1–1; src/a.cs 3–3; src/b.cs 1–1")
        parsed = sut.parse_explicit_unpinned(raw)
        self.assertEqual(len(parsed), 2)
        self.assertEqual(parsed[0]["reported_inclusive_intervals"], [[1, 1], [3, 3]])
        report, rows = sut.recover(self.repo, [self.row(969, raw, 3)],
                                   self.checkpoint)
        self.assertEqual(report["candidate_rows"], 1)
        self.assertEqual(report["candidate_line_occurrences"], 3)
        self.assertEqual(len(rows[0]["sources"]), 2)
        self.assertEqual(rows[0]["candidate_new_exact_path_blob_loc"], 3)

    def test_overlapping_duplicate_path_fragments_cannot_inflate_reviewed_loc(self):
        raw = "src/a.cs 1–1; src/a.cs 1–1; src/a.cs 3–3"
        parsed = sut.parse_explicit_unpinned(raw)
        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0]["reported_inclusive_intervals"], [[1, 1], [3, 3]])
        _, rows = sut.recover(self.repo, [self.row(970, raw, 3)],
                              self.checkpoint)
        self.assertEqual(rows[0]["status"], "workbook_nonblank_loc_mismatch")
        self.assertEqual(rows[0]["candidate_nonblank_loc"], 0)
        _, good = sut.recover(self.repo, [self.row(971, raw, 2)],
                              self.checkpoint)
        self.assertEqual(good[0]["candidate_nonblank_loc"], 2)

    def test_unavailable_checkpoint_never_implies_window_membership(self):
        bad_checkpoint = {**self.checkpoint,
                          "oldest_included_sha": "f" * 40}
        report, rows = sut.recover(self.repo, [
            self.row(247, "src/a.cs 1–3.", 2)], bad_checkpoint)
        self.assertEqual(rows[0]["window_membership"], "unverified_anchor")
        self.assertEqual(report.get("in_window_candidate_rows", 0), 0)

    def test_window_rotation_excludes_old_commit_candidate(self):
        (self.repo / "src/b.cs").write_text("bee\nupdated\n", encoding="utf-8")
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "second")
        new_head = git(self.repo, "rev-parse", "HEAD")
        checkpoint = {"head_sha": new_head, "oldest_included_sha": new_head,
                      "window_first_parent_commits": 1}
        _, rows = sut.recover(self.repo, [
            self.row(247, "src/a.cs 1–3.", 2),
            self.row(248, "src/b.cs 1–2", 2, sha=new_head)], checkpoint)
        self.assertEqual(rows[0]["window_membership"],
                         "outside_900_first_parent_window")
        self.assertEqual(rows[1]["window_membership"],
                         "in_900_first_parent_window")

    def test_bom_only_first_line_is_not_code_and_original_blob_identity_is_preserved(self):
        payload = b"\xef\xbb\xbf\ncode\n\n"
        self.commit_source_bytes(payload)
        report, rows = sut.recover(self.repo, [
            self.row(908, "src/a.cs 1–3", 1)], self.checkpoint)
        source = rows[0]["sources"][0]
        self.assertEqual(rows[0]["status"], "git_source_at_review_commit_candidate_only")
        self.assertEqual(source["nonblank_intervals_at_reviewed_commit"], [[2, 2]])
        self.assertEqual(source["reported_inclusive_intervals"], [[1, 3]])
        self.assertEqual(source["nonblank_loc"], 1)
        blob = source["blob_derived_at_reviewed_commit"]
        self.assertEqual(blob, git(self.repo, "rev-parse", "HEAD:src/a.cs"))
        self.assertEqual(subprocess.check_output(
            ["git", "-C", str(self.repo), "cat-file", "blob", blob]), payload)
        self.assertFalse(source["original_blob_pinned"])
        self.assertFalse(report["included_in_verified_pin_denominator"])
        self.assertIsNone(report["historical_900_density_recomputed"])

    def test_bom_before_actual_first_line_code_preserves_code_and_coordinates(self):
        self.commit_source_bytes(b"\xef\xbb\xbfcode\n\nmore code\n")
        _, rows = sut.recover(self.repo, [
            self.row(908, "src/a.cs 1–3", 2)], self.checkpoint)
        self.assertEqual(rows[0]["candidate_nonblank_loc"], 2)
        self.assertEqual(rows[0]["sources"][0]["nonblank_intervals_at_reviewed_commit"],
                         [[1, 1], [3, 3]])

    def test_interior_feff_is_not_globally_removed(self):
        self.commit_source_bytes(b"\xef\xbb\xbf\ncode\n\xef\xbb\xbf\n")
        _, rows = sut.recover(self.repo, [
            self.row(908, "src/a.cs 1–3", 2)], self.checkpoint)
        self.assertEqual(rows[0]["candidate_nonblank_loc"], 2)
        self.assertEqual(rows[0]["sources"][0]["nonblank_intervals_at_reviewed_commit"],
                         [[2, 3]])

    def test_true_bom_adjusted_count_mismatch_still_quarantines_the_entire_review(self):
        self.commit_source_bytes(b"\xef\xbb\xbf\ncode\n")
        raw = "src/a.cs 1–2; src/b.cs 1–1"
        report, rows = sut.recover(self.repo, [
            self.row(908, raw, 3), self.row(909, raw, 2)], self.checkpoint)
        bad, valid = rows
        self.assertEqual(bad["status"], "workbook_nonblank_loc_mismatch")
        self.assertEqual(bad["diagnostic_nonblank_loc_at_reviewed_commit"], 2)
        self.assertEqual(bad["candidate_nonblank_loc"], 0)
        self.assertEqual(bad["candidate_new_exact_path_blob_loc"], 0)
        self.assertEqual(bad["candidate_repeated_exact_path_blob_loc"], 0)
        self.assertEqual(bad["sources"], [])
        self.assertEqual(report["candidate_rows"], 1)
        self.assertEqual(valid["candidate_new_exact_path_blob_loc"], 2)
        self.assertEqual(valid["candidate_repeated_exact_path_blob_loc"], 0)
        self.assertNotIn("diagnostic_nonblank_loc_at_reviewed_commit", valid)


    def test_numeric_and_interval_recovery_is_exact_and_atomic(self):
        raw = "src/a.cs 1–1 and 3–3; src/b.cs 1–1"
        parsed = sut.parse_explicit_unpinned(raw)
        self.assertEqual(parsed, [
            {"path": "src/a.cs", "reported_inclusive_intervals": [[1, 1], [3, 3]]},
            {"path": "src/b.cs", "reported_inclusive_intervals": [[1, 1]]},
        ])
        _, audited = sut.recover(self.repo, [self.row(33, raw, 3)], self.checkpoint)
        self.assertEqual(audited[0]["status"], "git_source_at_review_commit_candidate_only")
        self.assertEqual(audited[0]["candidate_nonblank_loc"], 3)
        self.assertEqual(audited[0]["candidate_new_exact_path_blob_loc"], 3)
        self.assertFalse(audited[0]["original_blob_pinned"])
        # When any path or reported nonblank count is false, reject the
        # *entire* observation: never partially import its valid fragments.
        _, failed = sut.recover(self.repo, [
            self.row(34, "src/a.cs 1–1 and 3–3; src/missing.cs 1–1", 3),
            self.row(35, raw, 4)], self.checkpoint)
        self.assertEqual([r["candidate_nonblank_loc"] for r in failed], [0, 0])
        self.assertEqual([r["status"] for r in failed],
                         ["commit_path_unavailable", "workbook_nonblank_loc_mismatch"])

    def test_workbook_numeric_and_references_preserve_raw_and_path_count(self):
        # Original Review evidence sheet (Excel rows 33/34/35/38/40/46/47/49).
        # These are source-at-commit CANDIDATES, not original blob pins.
        cases = {
            33: ("ArchLucid.Application/InfraEvidence/SecureNowArchitect/PathRankingEngine.cs 20–55 and 123–153.", 1, 2),
            34: ("ArchLucid.Application/InfraEvidence/SecureNowArchitect/CutPointAnalysisEngine.cs 17–106 and 136–142; ArchLucid.Application/InfraEvidence/SecureNowArchitect/ICutPointAnalysisEngine.cs 6–34.", 2, 3),
            35: ("ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidenceCutPointRepository.cs 137–158 and 217–319; ArchLucid.Persistence/Migrations/383_SecurityEvidenceCutPoints.sql 10–39; ArchLucid.Persistence/Migrations/347_InfraEvidenceFoundation.sql 11–17; ArchLucid.Persistence/Migrations/381_SecurityEvidencePaths.sql 10–35; ArchLucid.Application/InfraEvidence/SecureNowArchitect/CutPointAnalysisEngine.cs 35–42 and 80–109.", 5, 7),
            38: ("ArchLucid.Application/InfraEvidence/SecureNowArchitect/SecurityEvidencePathRoutingMaterializer.cs 43–121; ArchLucid.Core/InfraEvidence/SecurityEvidencePathRoutingRole.cs 14–36; ArchLucid.Persistence/Migrations/347_InfraEvidenceFoundation.sql 49–63 and 154–163; ArchLucid.Persistence/Migrations/385_SecurityEvidencePathRouting.sql 8–33; ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathRoutingRepository.cs 194–224; ArchLucid.Persistence/Scripts/ArchLucid.sql 13454–13489.", 6, 7),
            40: ("ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathRankRepository.cs 106–128 and 188–275; ArchLucid.Persistence/Migrations/382_SecurityEvidencePathRanks.sql 20–47; ArchLucid.Persistence/Migrations/347_InfraEvidenceFoundation.sql 11–17; ArchLucid.Application/InfraEvidence/SecureNowArchitect/PathRankingEngine.cs 34–44 and 119–148; ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/ISecurityEvidencePathRankRepository.cs 22–33.", 5, 7),
            46: ("ArchLucid.Persistence/InfraEvidence/SqlRemediationPatternRepository.TryGetVersions.cs 1–48; ArchLucid.Persistence/Migrations/357_RemediationPatterns.sql 29–55; ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationPatternRepository.cs 25–57; ArchLucid.Core/InfraEvidence/RemediationPatternVersionKey.cs 1–3; ArchLucid.Application/InfraEvidence/RemediationPrioritization/RemediationPrioritizationService.cs 140–179 and 368–415; ArchLucid.Application/InfraEvidence/RemediationPrioritization/RemediationRiskScoreEvaluator.cs 182–202.", 6, 7),
            47: ("ArchLucid.Application/InfraEvidence/RemediationPatterns/RemediationPatternService.cs 109–157 and 419–434; ArchLucid.Application/InfraEvidence/RemediationPatterns/RemediationPatternGuard.cs 43–83; ArchLucid.Persistence/InfraEvidence/SqlRemediationPatternRepository.cs 59–113; ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationPatternRepository.cs 1–31; ArchLucid.Persistence/Migrations/357_RemediationPatterns.sql 9–26 and 29–55; ArchLucid.Persistence/InfraEvidence/NoOpRemediationPatternRepository.cs 1–33.", 6, 8),
            49: ("ArchLucid.Application/InfraEvidence/RemediationPatterns/RemediationPatternMatcherService.cs 20–58 and 60–152 and 154–260; ArchLucid.Persistence/InfraEvidence/SqlRemediationPatternMatchRepository.cs 30–54 and 98–145 and 180–217; ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationPatternMatchRepository.cs 1–48; ArchLucid.Persistence/Migrations/358_RemediationPatternMatches.sql 8–45; ArchLucid.Persistence/InfraEvidence/NoOpRemediationPatternMatchRepository.cs 1–38.", 5, 9),
        }
        for excel_row, (raw, expected_files, expected_spans) in cases.items():
            with self.subTest(excel_row=excel_row):
                event = self.row(excel_row, raw, 999)
                parsed = sut.parse_explicit_unpinned(event["reviewed_file_spans_raw"])
                self.assertIsNotNone(parsed)
                self.assertEqual(len(parsed), expected_files)
                self.assertEqual(sum(len(s["reported_inclusive_intervals"]) for s in parsed),
                                 expected_spans)
                self.assertEqual(event["reviewed_file_spans_raw"], raw)

    def test_workbook_row32_period_between_two_full_paths_only(self):
        raw = ("ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathRankRepository.cs 188–274 and 277–344. "
               "ArchLucid.Application/InfraEvidence/SecurityEvidencePathRankQueryService.cs 15–102.")
        parsed = sut.parse_explicit_unpinned(raw)
        self.assertEqual([s["path"] for s in parsed], [
            "ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathRankRepository.cs",
            "ArchLucid.Application/InfraEvidence/SecurityEvidencePathRankQueryService.cs"])
        self.assertEqual(parsed[0]["reported_inclusive_intervals"], [[188, 274], [277, 344]])
        self.assertEqual(parsed[1]["reported_inclusive_intervals"], [[15, 102]])

    def test_reject_narrative_missing_paths_and_ambiguous_interval_connectors(self):
        bad = [
            "src/a.cs 1–3 and narrative",
            "src/a.cs 1–3 and 4-foo",
            "src/a.cs 1–3. Follow-up was to inspect src/b.cs 1–1.",
            "src/a.cs 1–3, src/b.cs 1–1",
            "src/a.cs 1–3 and src/b.cs 1–1",
            "a.cs 1–3 and 4–5",
            "src/../src/a.cs 1–3 and 4–5",
            "src/a.cs 1–3 and 999-900",
            "src/a.cs 1–3 and1–4",
            "src/a.cs 1–3and 4–5",
        ]
        for raw in bad:
            with self.subTest(raw=raw):
                self.assertIsNone(sut.parse_explicit_unpinned(raw))




    def test_workbook_row22_explicit_prefixed_paths(self):
        # Original workbook Excel row 22 / #6634 at SHA
        # 8eb82c61fe1304d034414fe9d7b7a6bac4e9abee.
        # Six explicit relative subpaths under a FULL declared repo directory;
        # nonblank counts must be independently Git checked (195) by recovery.
        raw = (
            "Reviewed spans under archlucid-ui/src:\n"
            "- hooks/use-collection-runs-query.ts lines 1–54\n"
            "- hooks/use-operator-scope-query-key.ts lines 1–21\n"
            "- lib/operator/operator-scope-query-key.ts lines 1–53\n"
            "- lib/collection-runs-api.ts lines 1–44\n"
            "- lib/proxy-fetch-registration-scope.ts lines 1–26\n"
            "- lib/proxy-json-client.ts lines 1–18, 47–61, 90–93"
        )
        parsed = sut.parse_explicit_unpinned(raw)
        self.assertIsNotNone(parsed)
        self.assertEqual(len(parsed), 6)
        self.assertEqual(sum(len(x["reported_inclusive_intervals"]) for x in parsed), 8)
        self.assertEqual(parsed[0], {
            "path": "archlucid-ui/src/hooks/use-collection-runs-query.ts",
            "reported_inclusive_intervals": [[1, 54]],
        })
        self.assertEqual(parsed[-1], {
            "path": "archlucid-ui/src/lib/proxy-json-client.ts",
            "reported_inclusive_intervals": [[1, 18], [47, 61], [90, 93]],
        })

    def test_prefixed_directory_review_is_atomic_source_at_commit_candidate(self):
        for suffix, content in (
            ("hooks/a.cs", "one\n\ntwo\n"),
            ("lib/b.cs", "three\nfour\n"),
        ):
            dest = self.repo / "src" / "explicit" / suffix
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(content, encoding="utf-8")
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "explicit prefixed full paths")
        self.head = git(self.repo, "rev-parse", "HEAD")
        self.checkpoint.update(head_sha=self.head, oldest_included_sha=self.head)
        raw = ("Reviewed spans under src/explicit:\n"
               "- hooks/a.cs lines 1–3\n"
               "- lib/b.cs lines 1–2")
        report, rows = sut.recover(
            self.repo,
            [self.row(22, raw, 4), self.row(23, raw, 5)],
            self.checkpoint,
        )
        self.assertEqual(report["candidate_rows"], 1)
        self.assertEqual(rows[0]["status"], "git_source_at_review_commit_candidate_only")
        self.assertEqual(rows[0]["candidate_nonblank_loc"], 4)
        self.assertFalse(rows[0]["original_blob_pinned"])
        self.assertEqual([x["nonblank_loc"] for x in rows[0]["sources"]], [2, 2])
        self.assertEqual(rows[1]["status"], "workbook_nonblank_loc_mismatch")
        self.assertEqual(rows[1]["candidate_nonblank_loc"], 0)
        self.assertEqual(rows[1]["sources"], [])

    def test_prefix_cannot_resolve_basename_guess_or_narrative(self):
        rejected = (
            "Reviewed spans under src/explicit:\n- a.cs lines 1–3",
            "Reviewed spans under src/explicit:\n- hooks/a.cs lines 1–3\n- b.cs lines 1–1",
            "Reviewed spans under src/explicit:\n- hooks/a.cs 1–3",
            "Reviewed spans under src/explicit:\n- hooks/a.cs lines 1–3 and narrative",
            "Reviewed spans under src/../explicit:\n- hooks/a.cs lines 1–3",
            "Reviewed spans under src/explicit:\n- hooks/../a.cs lines 1–3",
            "Reviewed spans under src/explicit:\n- hooks/a.cs lines 1–3\nAnd now narrative",
            "Reviewed the complete baseline SQL connection factories in src/explicit: a.cs (27)",
        )
        for raw in rejected:
            with self.subTest(raw=raw):
                self.assertIsNone(sut.parse_explicit_unpinned(raw))

if __name__ == "__main__":
    unittest.main()
