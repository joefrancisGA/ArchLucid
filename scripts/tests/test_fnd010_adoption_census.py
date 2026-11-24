import json
from pathlib import Path
import tempfile
import unittest

from scripts.architecture.fnd010_adoption_census import check_order, discover_action_candidates, git_blob_id, scan


class AdoptionCensusTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = "ArchLucid.Api/Controllers/Planning/SampleController.cs"
        self.registry = "registry.json"
        self.original = """public class SampleController
{
    [HttpGet("one")]
    [HttpGet("alias")]
    public async Task<IActionResult> Read()
    {
        var denied = await AuthorizeAsync();
        if (denied is not null) return denied;
        return await ReadEvidenceAsync();
    }
}
"""
        self.write(self.source, self.original)
        self.write(self.registry, json.dumps({"entries": [
            {"controller_file": "Planning/SampleController.cs"},
            {"controller_file": "Planning/UnreviewedController.cs"},
        ]}))
        self.baseline = {
            "schemaVersion": 1, "baselineCommit": "pinned", "scope": "unit test",
            "registryPath": self.registry, "registryBlob": self.blob(self.registry),
            "actions": [{
                "id": "SampleController.Read",
                "controllerFile": "Planning/SampleController.cs",
                "action": "Read", "source": self.source, "status": "conformant",
                "reason": "Reviewed gate and denial before evidence.",
                "evidence": [{"path": self.source, "blob": self.blob(self.source)}],
                "orderChecks": [{"path": self.source,
                    "start": "public async Task<IActionResult> Read(",
                    "tokens": ["AuthorizeAsync()", "return denied", "ReadEvidenceAsync()"]}],
            }],
        }

    def write(self, path, value):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(value, encoding="utf-8")

    def blob(self, path):
        return git_blob_id((self.root / path).read_bytes())

    def test_exact_evidence_preserves_review_and_deduplicates_aliases(self):
        report = scan(self.root, self.baseline)
        self.assertEqual(report["counts"]["conformant"], 1)
        self.assertEqual(report["conformantFraction"], 1.0)
        self.assertEqual(report["staleActionCount"], 0)
        self.assertEqual(report["discoveredHttpActionCandidates"], 1)
        self.assertEqual(report["unclassifiedHttpActionCandidates"], [])
        self.assertEqual(report["unrepresentedRegistryFiles"], ["Planning/UnreviewedController.cs"])

    def test_changed_evidence_invalidates_conformance_even_if_token_order_passes(self):
        self.write(self.source, self.original + "// changed implementation\n")
        report = scan(self.root, self.baseline)
        self.assertEqual(report["counts"]["conformant"], 0)
        self.assertEqual(report["counts"]["unverified"], 1)
        self.assertEqual(report["actions"][0]["orderSentinelFailures"], [])
        self.assertEqual(report["staleActionCount"], 1)

    def test_moved_read_or_ignored_denial_fails_order_sentinel(self):
        source = self.original.replace(
            "if (denied is not null) return denied;\n        return await ReadEvidenceAsync();",
            "await ReadEvidenceAsync();\n        if (denied is not null) return denied;\n        return Ok();")
        self.write(self.source, source)
        report = scan(self.root, self.baseline)
        self.assertEqual(report["counts"]["unverified"], 1)
        self.assertEqual(len(report["actions"][0]["orderSentinelFailures"]), 1)

    def test_deleted_evidence_does_not_disappear_from_denominator(self):
        (self.root / self.source).unlink()
        report = scan(self.root, self.baseline)
        self.assertEqual(report["eligibleOrCandidateActions"], 1)
        self.assertEqual(report["counts"]["unverified"], 1)

    def test_new_action_in_partial_is_discovered_but_not_credited(self):
        self.write("ArchLucid.Api/Controllers/Planning/SampleController.More.cs",
                   'public partial class SampleController\n{\n    [HttpPost]\n'
                   '    public Task<IActionResult> Another() => throw new Exception();\n}\n')
        report = scan(self.root, self.baseline)
        self.assertEqual(report["discoveredHttpActionCandidates"], 2)
        self.assertEqual([a["action"] for a in report["unclassifiedHttpActionCandidates"]], ["Another"])
        self.assertEqual(report["reviewedActionCount"], 1)

    def test_unresolved_attribute_reported(self):
        self.write("ArchLucid.Api/Controllers/OtherController.cs",
                   "public class OtherController\n{\n    [HttpGet]\n}\n")
        _, unresolved = discover_action_candidates(self.root)
        self.assertEqual(len(unresolved), 1)

    def test_order_check_does_not_credit_token_in_next_method(self):
        self.assertFalse(check_order(
            "    public Task Read()\n    { Gate(); }\n    private Task Other()\n    { Load(); }",
            "public Task Read(", ["Gate()", "Load()"]))

    def test_changed_exemption_is_not_silently_kept_exempt(self):
        self.baseline["actions"][0]["status"] = "exempt"
        self.write(self.source, self.original + "// change\n")
        report = scan(self.root, self.baseline)
        self.assertEqual(report["counts"]["exempt"], 0)
        self.assertEqual(report["eligibleOrCandidateActions"], 1)

    def test_duplicate_review_rows_rejected(self):
        self.baseline["actions"].append(self.baseline["actions"][0])
        with self.assertRaises(ValueError):
            scan(self.root, self.baseline)


if __name__ == "__main__":
    unittest.main()
