from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path


def _load_guard_module(repo_root: Path):
    script = repo_root / "scripts" / "ci" / "assert_no_utf8_mojibake_in_user_source.py"
    spec = importlib.util.spec_from_file_location("assert_no_utf8_mojibake_in_user_source", script)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module


class TestAssertNoUtf8MojibakeInUserSource(unittest.TestCase):
    def test_script_exits_zero_on_repo_trees(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        script = repo_root / "scripts" / "ci" / "assert_no_utf8_mojibake_in_user_source.py"
        result = subprocess.run(
            [sys.executable, str(script)],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_forbidden_regex_detects_common_literals(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        guard = _load_guard_module(repo_root)

        self.assertIsNotNone(guard.FORBIDDEN_RE.search("Loading ROI summaryâ€¦"))
        self.assertIsNotNone(guard.FORBIDDEN_RE.search("docs/PILOT_ROI_MODEL.md Â§4"))
        self.assertIsNone(guard.FORBIDDEN_RE.search("Loading ROI summary…"))
        self.assertIsNone(guard.FORBIDDEN_RE.search("docs/PILOT_ROI_MODEL.md §4"))


if __name__ == "__main__":
    unittest.main()
