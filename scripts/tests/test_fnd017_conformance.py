import tempfile
from pathlib import Path
import unittest

from scripts.architecture.fnd017_conformance import scan, compare


class ConformanceTests(unittest.TestCase):
    def test_detects_forbidden_import_and_call(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "sample.py").write_text("import subprocess\nexec('pass')\n")
            result = scan(root, {"rules": [{
                "id": "X", "paths": ["sample.py"],
                "forbiddenImports": ["subprocess"], "forbiddenCalls": ["exec"]
            }]})
            self.assertEqual({f["kind"] for f in result["findings"]},
                             {"forbidden_import", "forbidden_call"})

    def test_missing_file_is_reported_not_silently_ignored(self):
        with tempfile.TemporaryDirectory() as folder:
            result = scan(Path(folder), {"rules": [{"id": "X", "paths": ["missing.py"]}]})
            self.assertEqual(result["findings"][0]["kind"], "missing_file")

    def test_required_token_and_forbidden_token(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "x.cs").write_text("unsafe execution\n")
            result = scan(root, {"rules": [{
                "id": "X", "paths": ["x.cs"],
                "requiredTokens": ["audit.WriteAsync("],
                "forbiddenTokens": ["unsafe execution"]
            }]})
            self.assertEqual(len(result["findings"]), 2)

    def test_drift_tracks_new_and_resolved(self):
        old = {"findings": [{"fingerprint": "a"}, {"fingerprint": "b"}]}
        current = {"findings": [{"fingerprint": "b"}, {"fingerprint": "c"}]}
        self.assertEqual(compare(current, old),
                         {"new": ["c"], "resolved": ["a"], "unchanged": 1})

    def test_fingerprint_is_deterministic(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "x.py").write_text("import socket\n")
            policy = {"rules": [{"id": "X", "paths": ["x.py"],
                                 "forbiddenImports": ["socket"]}]}
            self.assertEqual(scan(root, policy), scan(root, policy))


if __name__ == "__main__":
    unittest.main()
