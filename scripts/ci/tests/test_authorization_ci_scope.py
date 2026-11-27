import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    "authorization_ci_scope", Path(__file__).resolve().parents[1] / "authorization_ci_scope.py"
)
scope = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scope)

class AuthorizationScopeTests(unittest.TestCase):
    def test_prose_only(self):
        self.assertFalse(scope.requires_tests("pull_request", ["docs/guide.md"]))

    def test_unknown_and_empty_run(self):
        self.assertTrue(scope.requires_tests("pull_request", []))
        self.assertTrue(scope.requires_tests("pull_request", ["unknown.txt"]))

    def test_security_and_architecture_docs_run(self):
        for path in ["docs/security/ACL.md", "docs/architecture/gate.md"]:
            self.assertTrue(scope.requires_tests("pull_request", [path]))

    def test_mixed_changes_run(self):
        self.assertTrue(scope.requires_tests("pull_request", [
            "docs/guide.md", "ArchLucid.Api/Security/Gate.cs"
        ]))

    def test_release_and_merge_queue_run(self):
        for event in ["merge_group", "workflow_dispatch", "push"]:
            self.assertTrue(scope.requires_tests(event, ["docs/guide.md"]))

if __name__ == "__main__":
    unittest.main()
