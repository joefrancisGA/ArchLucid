"""TB-240 sponsor ROI invariant drift guards (Batch 5AN)."""



from __future__ import annotations



import unittest

from pathlib import Path





REPO_ROOT = Path(__file__).resolve().parents[3]





class TestAdoptionBatch5AN(unittest.TestCase):

    def test_tb_240_invariant_tests_file_exists(self) -> None:

        path = REPO_ROOT / "ArchLucid.Application.Tests" / "Roi" / "SponsorRoiSummaryInvariantTests.cs"

        text = path.read_text(encoding="utf-8")

        self.assertIn("SponsorRoiSummaryInvariantTests", text)

        self.assertIn("Regression guard for TB-149", text)

        self.assertIn("Regression guard for TB-103", text)

        self.assertIn("Regression guard for TB-155", text)



    def test_tb_240_waiver_consistency_invariant(self) -> None:

        path = REPO_ROOT / "ArchLucid.Application.Tests" / "Roi" / "SponsorRoiSummaryInvariantTests.cs"

        text = path.read_text(encoding="utf-8")

        self.assertIn("Expiring_waiver_count_matches_between_roi_summary_and_decisions_needed", text)



    def test_tb_240_orphan_single_pipeline_invariant(self) -> None:

        path = REPO_ROOT / "ArchLucid.Application.Tests" / "Roi" / "SponsorRoiSummaryInvariantTests.cs"

        text = path.read_text(encoding="utf-8")

        self.assertIn("Orphan_candidate_count_uses_single_pipeline_not_double_markers", text)





if __name__ == "__main__":

    unittest.main()

