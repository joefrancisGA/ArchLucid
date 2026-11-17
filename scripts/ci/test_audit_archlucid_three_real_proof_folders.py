import json
import tempfile
import unittest
from pathlib import Path
from scripts.ci.audit_archlucid_three_real_proof_folders import audit_one, audit_paths

def summary(run_id):
    return {
        "runId": run_id, "sponsorPacketDisposition": "SEND",
        "sponsorHandoffMode": True,
        "realModeEvidenceStatus": "PASS",
        "executionModeEvidenceCaptured": True,
        "aiReadinessGate": {"disposition": "PASS"},
        "roiSponsorSafe": True, "blockCount": 0, "sendEligible": True,
    }

class RealPilotProofCandidateTests(unittest.TestCase):
    def test_three_distinct_local_packets_are_candidates_only(self):
        with tempfile.TemporaryDirectory() as d:
            folders=[]
            for i in range(1,4):
                folder=Path(d,str(i))
                folder.mkdir()
                (folder/"go-no-go-summary.json").write_text(json.dumps(summary(
                    f"00000000-0000-0000-0000-{i:012d}")))
                folders.append(folder)
            result=audit_paths(folders)
            self.assertTrue(result["meetsLocalMetadataPrerequisites"])
            self.assertEqual("UNCHANGED", result["canonicalG4Gate"])
            self.assertFalse(result["customerEvidenceVerified"])
            output=json.dumps(result)
            self.assertNotIn("00000000-0000-", output)

    def test_one_duplicate_never_counts_twice(self):
        with tempfile.TemporaryDirectory() as d:
            paths=[]
            for name in ("A","B"):
                folder=Path(d,name)
                folder.mkdir()
                (folder/"go-no-go-summary.json").write_text(json.dumps(summary(
                    "00000000-0000-0000-0000-000000000001")))
                paths.append(folder)
            result=audit_paths(paths)
            self.assertEqual(1, result["distinctCandidateCount"])
            self.assertEqual(1, result["blockingReasons"]["DUPLICATE_COMMITTED_RUN_ID"])

    def test_simulator_or_unverified_claims_are_blocked(self):
        for key, value in [
            ("realModeEvidenceStatus", "WARN"),
            ("executionModeEvidenceCaptured", False),
            ("sponsorPacketDisposition", "HOLD"),
            ("roiSponsorSafe", False),
            ("blockCount", 1),
            ("sendEligible", False),
        ]:
            row=summary("00000000-0000-0000-0000-000000000001")
            row[key]=value
            _, problems=audit_one(row)
            self.assertTrue(problems, key)

    def test_missing_and_malformed_packets_are_inconclusive(self):
        with tempfile.TemporaryDirectory() as d:
            folder=Path(d)
            a=audit_paths([folder])
            self.assertEqual(0,a["distinctCandidateCount"])
            (folder/"go-no-go-summary.json").write_text("{not json")
            b=audit_paths([folder])
            self.assertIn("UNREADABLE_SUMMARY",b["blockingReasons"])

if __name__=="__main__":
    unittest.main()
