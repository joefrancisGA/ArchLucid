#!/usr/bin/env python3
"""SecureNow beta evidence matrix acceptance tests."""
import importlib.util
from pathlib import Path
import unittest
import json
import tempfile
import subprocess
import sys

script = Path(__file__).with_name("check_securenow_beta_evidence.py")
spec = importlib.util.spec_from_file_location("securenow_beta_evidence", script)
assert spec is not None and spec.loader is not None
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class BetaMatrixProvenanceTests(unittest.TestCase):
    def matrix(self):
        return {"requirements": [
            {"id": item, "status": "UNKNOWN", "evidence": "No independently verified result."}
            for item in module.IDS
        ]}

    def test_unknown_matrix_is_structurally_valid_not_release_ready(self):
        matrix = self.matrix()
        self.assertEqual(module.validate(matrix), [])
        self.assertTrue(module.validate(matrix, strict=True))

    def test_forty_malformed_status_values_fail_without_exceptions(self):
        statuses = [None, 0, 1, True, False, [], {}, ["PASS"],
                    {"status": "PASS"}, 3.14, -1, "", "pass", "Passed",
                    "SKIP", "SKIPPED", "GO", "UNKNOWN ", " PASS", "FAIL ",
                    "success", "error", "approved", "complete", "null",
                    ["FAIL"], [None], {"a": 1}, 9999, -9999,
                    "warn", "WARN", "not_run", "blocked", "N/A",
                    ("PASS",), (1,), 1.0, -0.1, "true"]
        self.assertEqual(len(statuses), 40)
        for status in statuses:
            with self.subTest(status=status):
                matrix = self.matrix()
                matrix["requirements"][0]["status"] = status
                issues = module.validate(matrix)
                self.assertTrue(any("invalid status" in issue for issue in issues))

    def test_non_object_roots_and_unhashable_statuses_fail_in_cli(self):
        for payload in (None, [], {}, {"requirements": [{"status": []}]},
                        {"requirements": [{"id": module.IDS[0], "status": []}]}):
            with self.subTest(payload=payload), tempfile.TemporaryDirectory() as temp_dir:
                path = Path(temp_dir) / "matrix.json"
                path.write_text(json.dumps(payload), encoding="utf-8")
                completed = subprocess.run([sys.executable, str(script), "--matrix", str(path)],
                                           capture_output=True, text=True, check=False)
                self.assertEqual(completed.returncode, 1)
                self.assertNotIn("Traceback", completed.stderr)

    def test_pass_requires_full_git_sha(self):
        matrix = self.matrix()
        matrix["requirements"][0].update(status="PASS", evidence="Recorded CI run",
            test_command="dotnet test", result_reference="https://github.com/example/runs/123",
            commit_sha="abc")
        self.assertTrue(any("40-character" in e for e in module.validate(matrix)))

    def test_placeholder_command_and_reference_are_rejected(self):
        matrix = self.matrix()
        matrix["requirements"][0].update(status="PASS", evidence="Recorded CI run",
            test_command="pass", result_reference="yes", commit_sha="a" * 40)
        issues = module.validate(matrix)
        self.assertTrue(any("test_command" in e for e in issues))
        self.assertTrue(any("result_reference" in e for e in issues))

    def test_well_formed_pass_metadata_is_allowed_but_not_authenticated(self):
        matrix = self.matrix()
        matrix["requirements"][0].update(status="PASS", evidence="Recorded CI run",
            test_command="dotnet test ArchLucid.Application.Tests",
            result_reference="https://github.com/example/actions/runs/123",
            commit_sha="a" * 40)
        self.assertEqual(module.validate(matrix), [])

if __name__ == "__main__":
    unittest.main()
