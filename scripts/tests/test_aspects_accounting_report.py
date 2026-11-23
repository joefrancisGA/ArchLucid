"""One Aspects reporting contract: historical and provisional cannot inflate Git verified."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import aspects_accounting_report as sut


def fixture():
    historical=[]
    origin=datetime(2026,11,20,12,0,tzinfo=timezone.utc)
    for i in range(79):
        defects=150+i
        loc=50000+500*i
        historical.append({
            "excel_row":i+6,"window_first_parent_commits":900,
            "provenance":"historical_workbook_partial_snapshot",
            "head_sha":"a"*40,"oldest_sha":"b"*40,
            "as_of_utc":(origin+timedelta(minutes=i)).isoformat(),
            "defects_reported":defects,"unique_loc_reported":loc,
            "density_per_kloc_reported":1000*defects/loc,
        })
    provisional=[]
    workbook=[]
    running_defects=400
    running_loc=300000
    for i in range(700):
        added_defect=1 if i%10==0 else 0
        new_loc=5 if i%8 else 0
        running_defects+=added_defect
        running_loc+=new_loc
        label=f"review-{i}"
        provenance=("provisional_backprojection_from_600_series_seed"
                    if i<100 else "provisional_600_series_workbook")
        provisional.append({
            "observation":i+1,"provenance":provenance,
            "review_or_defect_id":label,"cumulative_defects":running_defects,
            "cumulative_loc":running_loc,
            "defects":added_defect,"new_unique_loc":new_loc,
            "defects_per_kloc":1000*running_defects/running_loc,
        })
        if i>=100:
            workbook.append({
                "observation":i-99,"review_or_defect_id":label,
                "cumulative_defects":running_defects,
                "cumulative_loc":running_loc,
                "defects":added_defect,"new_unique_loc":new_loc,
                "defects_per_kloc_reported":1000*running_defects/running_loc,
            })
    return historical,provisional,workbook


class AccountingReportTests(unittest.TestCase):
    def test_reconciles_all_three_populations_without_splicing(self):
        historical,provisional,workbook=fixture()
        result,points79,points700=sut.build_report(
            historical,provisional,workbook,None)
        self.assertEqual(result["publication_contract"],
                         "three_disjoint_accounting_populations_no_splicing")
        self.assertEqual(result["historical_900"]["actual_snapshots"],79)
        self.assertEqual(result["provisional_700"]["observations"],700)
        self.assertEqual(result["provisional_700"]["backprojected_observations"],100)
        self.assertEqual(result["provisional_700"]["workbook_observations"],600)
        self.assertEqual(len(points79),79)
        self.assertEqual(len(points700),700)
        self.assertIsNone(points700[23]["sma25_defects_per_kloc"])
        self.assertAlmostEqual(points700[24]["sma25_defects_per_kloc"],
                               sum(x["defects_per_kloc"] for x in points700[:25])/25)
        self.assertIsNone(result["current_verified_subset"]["new_reviewed_loc"])
        self.assertIsNone(result["current_verified_subset"]["new_distinct_defect_ids"])
        self.assertIn("Historical 700-observation chart",sut.markdown(result))

    def test_real_repository_historical_and_provisional_evidence_checkpoints(self):
        root = Path(__file__).resolve().parents[2] / "docs" / "engineering" / "aspects-historical"
        h,_ = sut.rows_from(root / "aspects-historical-900-snapshots.jsonl")
        p,_ = sut.rows_from(root / "aspects-provisional-700-series.jsonl")
        w,_ = sut.rows_from(root / "aspects-provisional-600-series.jsonl")
        report, actual79, actual700 = sut.build_report(h,p,w,None)
        self.assertEqual((len(actual79),len(actual700)),(79,700))
        self.assertAlmostEqual(report["historical_900"]["recomputed_defects_per_kloc"],
                               1.3479207667136353,places=10)
        self.assertAlmostEqual(report["historical_900"]["recomputed_sma25"],
                               1.343106697337923,places=10)
        self.assertAlmostEqual(report["provisional_700"]["latest_provisional_defects_per_kloc"],
                               1.428081135949834,places=10)
        self.assertAlmostEqual(report["provisional_700"]["recomputed_sma25"],
                               1.3940221717423011,places=10)
        self.assertNotAlmostEqual(
            report["historical_900"]["recomputed_sma25"],
            h[-1]["sma_25_reported"],places=4)
        self.assertIsNone(report["current_verified_subset"]["new_reviewed_loc"])

    def test_full_historical_900_series_requires_actual_snapshot_count(self):
        h,p,w=fixture()
        with self.assertRaisesRegex(ValueError,"expected 79 actual"):
            sut.build_report(h[:-1],p,w,None)

    def test_700_tail_must_equal_original_600_source_evidence(self):
        h,p,w=fixture()
        w[42]["new_unique_loc"]+=1
        with self.assertRaisesRegex(ValueError,"tail differs"):
            sut.build_report(h,p,w,None)

    def test_700_defects_and_incremental_loc_conservation_fail_closed(self):
        h,p,w=fixture()
        p[200]["new_unique_loc"]+=1
        with self.assertRaisesRegex(ValueError,"cumulative changes"):
            sut.build_report(h,p,w,None)

    def test_700_rate_must_equal_reported_cumulative_numerator_and_loc(self):
        h,p,w=fixture()
        p[-1]["defects_per_kloc"]+=0.01
        with self.assertRaisesRegex(ValueError,"arithmetic mismatch"):
            sut.build_report(h,p,w,None)

    def test_700_first_100_must_remain_identifiable_backprojection(self):
        h,p,w=fixture()
        p[25]["provenance"]="provisional_600_series_workbook"
        with self.assertRaisesRegex(ValueError,"seed/workbook boundary"):
            sut.build_report(h,p,w,None)

    def test_historical_snapshot_cannot_substitute_for_full_window_evidence(self):
        h,p,w=fixture()
        h[-1]["window_first_parent_commits"]=899
        with self.assertRaisesRegex(ValueError,"original or malformed"):
            sut.build_report(h,p,w,None)

    def test_missing_comparable_prior_verified_snapshot_means_unknown_not_zero(self):
        snapshot={
            "schema_version":2,
            "method":"first_parent_verified_path_blob_span_union_v2",
            "scope":"narrow_incremental_review_ledger_subset",
            "cohort":{"status":"complete","actual_commits":900,"head_sha":"a"*40},
            "status":"source_verified_subset",
            "head":"a"*40,"captured_utc":"2026-11-23T17:00:00+00:00",
            "freshness":"no_prior_snapshot",
            "comparison":{"status":"unavailable"},
            "density":{"distinct_confirmed_defects":45,
                       "unique_path_blob_reviewed_lines":2528,
                       "defects_per_kloc":17.800633},
            "review":{"new_unique_path_blob_lines_since_prior":None,
                      "new_line_occurrences_since_prior":None,
                      "repeated_line_occurrences_since_prior":None,
                      "new_defects_since_prior":None},
        }
        r=sut.verified_subset(snapshot)
        self.assertEqual(r["status"],"source_verified_subset")
        self.assertEqual(r["distinct_defect_ids"],45)
        self.assertEqual(r["exact_path_blob_unique_reviewed_loc"],2528)
        self.assertIsNone(r["new_reviewed_loc"])
        self.assertIsNone(r["new_distinct_defect_ids"])
        self.assertIsNone(r["signed_rate_delta"])
        self.assertFalse(r["cross_revision_dedup_complete"])

    def test_live_comparable_delta_reports_new_and_repeated_without_double_count(self):
        snapshot={
            "schema_version":2,
            "method":"first_parent_verified_path_blob_span_union_v2",
            "scope":"narrow_incremental_review_ledger_subset",
            "cohort":{"status":"complete","actual_commits":900,"head_sha":"a"*40},
            "status":"source_verified_subset","head":"a"*40,
            "comparison":{"status":"comparable"},"freshness":"new_verified_evidence",
            "density":{"distinct_confirmed_defects":2,
                       "unique_path_blob_reviewed_lines":1000,
                       "defects_per_kloc":2.0,"signed_delta":0.25},
            "review":{"new_unique_path_blob_lines_since_prior":35,
                      "new_line_occurrences_since_prior":50,
                      "repeated_line_occurrences_since_prior":15,
                      "new_defects_since_prior":1},
        }
        r=sut.verified_subset(snapshot)
        self.assertEqual(r["new_reviewed_loc"],35)
        self.assertEqual(r["new_line_occurrences"],50)
        self.assertEqual(r["repeated_reviewed_loc"],15)
        self.assertEqual(r["new_distinct_defect_ids"],1)
        self.assertEqual(r["signed_rate_delta"],0.25)
        snapshot["review"]["repeated_line_occurrences_since_prior"]=16
        with self.assertRaisesRegex(ValueError,"new . repeats"):
            sut.verified_subset(snapshot)

    def test_live_report_rejects_prior_git_head_even_with_valid_arithmetic(self):
        snap={
            "schema_version":2,
            "method":"first_parent_verified_path_blob_span_union_v2",
            "scope":"narrow_incremental_review_ledger_subset",
            "cohort":{"status":"complete","actual_commits":900,"head_sha":"a"*40},
            "status":"source_verified_subset","head":"a"*40,
            "density":{"distinct_confirmed_defects":1,
                       "unique_path_blob_reviewed_lines":1000,
                       "defects_per_kloc":1.0},
            "review":{},
        }
        with self.assertRaisesRegex(ValueError,"Git head differs"):
            sut.verified_subset(snap,expected_head="b"*40)
        snap["cohort"]["head_sha"]="c"*40
        with self.assertRaisesRegex(ValueError,"Git head differs"):
            sut.verified_subset(snap,expected_head="a"*40)
        snap["cohort"]["head_sha"]="a"*40
        self.assertEqual(sut.verified_subset(snap,expected_head="a"*40)["current_head"],
                         "a"*40)

    def test_bad_live_density_never_accepted(self):
        snapshot={
            "schema_version":2,"method":"first_parent_verified_path_blob_span_union_v2",
            "scope":"narrow_incremental_review_ledger_subset",
            "cohort":{"status":"complete","actual_commits":900,"head_sha":"a"*40},
            "status":"source_verified_subset",
            "density":{"distinct_confirmed_defects":2,
                       "unique_path_blob_reviewed_lines":1000,
                       "defects_per_kloc":20.0},
            "review":{},
        }
        with self.assertRaisesRegex(ValueError,"disagrees"):
            sut.verified_subset(snapshot)

    def test_chart_is_exactly_700_provisional_points_with_25_sma(self):
        h,p,w=fixture()
        _,_,points=sut.build_report(h,p,w,None)
        svg=sut.svg_chart(points)
        self.assertIn("700 historical provisional observations",svg)
        self.assertIn("25-point simple moving average",svg)
        self.assertIn("NOT 700 independently verified snapshots",svg)
        with self.assertRaisesRegex(ValueError,"no fake 700-point chart"):
            sut.svg_chart(points[:600])

    def test_missing_verified_snapshot_is_not_claimed_as_zero_reviews(self):
        r=sut.verified_subset(None)
        self.assertIsNone(r["new_reviewed_loc"])
        self.assertIsNone(r["new_distinct_defect_ids"])
        self.assertIsNone(r["defects_per_kloc"])


if __name__=="__main__":
    unittest.main()
