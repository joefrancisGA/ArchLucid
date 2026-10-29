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

if __name__=="__main__":
    unittest.main()
