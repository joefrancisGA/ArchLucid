import unittest
from scripts.ci.score_blinded_buyer_comparison import RUBRIC, compare

def row(case, option, score, evaluator="reviewer"):
    return {"caseId": case, "evaluatorId": evaluator, "option": option,
            "scores": {key: score for key in RUBRIC}}

class ComparisonRubricTests(unittest.TestCase):
    def test_matched_review_reports_descriptive_only(self):
        data={"schema": "archlucid.blinded-comparison-input.v1",
              "product":"SecureNow", "cohortClass":"SYNTHETIC",
              "cases":[item for i in range(3) for item in
                       (row(str(i), "SecureNow", 4), row(str(i), "ExistingCSPMWorkflow", 3))]}
        result=compare(data)
        self.assertEqual("DESCRIPTIVE_MATCHED_EVALUATION_NOT_MARKET_PROOF", result["status"])
        self.assertEqual(1, result["dimensionDeltas"]["actionability"]["medianDelta"])
        self.assertIsNone(result["winner"])
        self.assertEqual("SYNTHETIC", result["cohortClass"])

    def test_incomplete_or_duplicate_pair_fails_closed(self):
        payload={"schema":"archlucid.blinded-comparison-input.v1",
                 "product":"ArchLucid", "cohortClass":"INTERNAL_DOGFOOD",
                 "cases":[row("one", "ArchLucid", 5)]}
        with self.assertRaises(ValueError):
            compare(payload)
        payload["cases"]=[row("one","ArchLucid",5), row("one","ArchLucid",5)]
        with self.assertRaises(ValueError):
            compare(payload)

    def test_below_three_matched_pairs_not_approved(self):
        payload={"schema":"archlucid.blinded-comparison-input.v1",
                 "product":"ArchLucid", "cohortClass":"INTERNAL_DOGFOOD",
                 "cases":[row("one", "ArchLucid", 3), row("one", "ManualOrGenericAI", 3)]}
        result=compare(payload)
        self.assertEqual("INSUFFICIENT_MATCHED_REVIEWS", result["status"])
        self.assertIsNone(result["winner"])

    def test_repeated_reviewers_on_one_case_cannot_replace_three_independent_cases(self):
        payload = {"schema": "archlucid.blinded-comparison-input.v1",
                   "product": "SecureNow", "cohortClass": "INTERNAL_DOGFOOD",
                   "cases": [
                       entry
                       for reviewer in ("one", "two", "three", "four")
                       for entry in (
                           row("same-case", "SecureNow", 5, reviewer),
                           row("same-case", "ExistingCSPMWorkflow", 0, reviewer),
                       )
                   ]}
        result = compare(payload)
        self.assertEqual("INSUFFICIENT_DISTINCT_CASES", result["status"])
        self.assertEqual(4, result["matchedPairs"])
        self.assertEqual(1, result["distinctCases"])
        self.assertEqual({}, result["dimensionDeltas"])
        self.assertIsNone(result["winner"])

    def test_uneven_reviewer_counts_do_not_overweight_one_favorable_case(self):
        # Ten favorable reviews of A do not outweigh independent cases B/C.
        cases = [
            entry
            for reviewer in (f"reviewer-{i}" for i in range(10))
            for entry in (
                row("A", "ArchLucid", 5, reviewer),
                row("A", "ManualOrGenericAI", 0, reviewer),
            )
        ]
        for case in ("B", "C"):
            cases.extend([row(case, "ArchLucid", 0),
                          row(case, "ManualOrGenericAI", 5)])
        result = compare({"schema": "archlucid.blinded-comparison-input.v1",
                          "product": "ArchLucid", "cohortClass": "SYNTHETIC",
                          "cases": cases})
        self.assertEqual("DESCRIPTIVE_MATCHED_EVALUATION_NOT_MARKET_PROOF", result["status"])
        self.assertEqual(12, result["matchedPairs"])
        self.assertEqual(3, result["distinctCases"])
        self.assertEqual("ONE_EQUAL_WEIGHT_PER_DISTINCT_CASE", result["aggregation"])
        for dimension in RUBRIC:
            result_row = result["dimensionDeltas"][dimension]
            self.assertEqual(-5, result_row["medianDelta"])
            self.assertEqual(3, result_row["independentCaseCount"])
            self.assertEqual(12, result_row["pairedCount"])
        self.assertIsNone(result["winner"])
        self.assertNotIn("reviewer-0", str(result))

    def test_equal_case_weight_with_multiple_reviewers_uses_case_median(self):
        # Case A's +5, -5, +5 has median +5; other two cases are 0.
        cases = []
        for evaluator, primary, alternative in (
                ("e1", 5, 0), ("e2", 0, 5), ("e3", 5, 0)):
            cases.extend([row("A", "SecureNow", primary, evaluator),
                          row("A", "ExistingCSPMWorkflow", alternative, evaluator)])
        for case in ("B", "C"):
            cases.extend([row(case, "SecureNow", 3),
                          row(case, "ExistingCSPMWorkflow", 3)])
        report = compare({"schema": "archlucid.blinded-comparison-input.v1",
                          "product": "SecureNow", "cohortClass": "INTERNAL_DOGFOOD",
                          "cases": cases})
        self.assertEqual(0, report["dimensionDeltas"]["actionability"]["medianDelta"])
        self.assertEqual(3, report["distinctCases"])


if __name__=="__main__":
    unittest.main()
