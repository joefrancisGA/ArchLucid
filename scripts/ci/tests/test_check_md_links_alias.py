import subprocess
import unittest
from pathlib import Path

from ci_test_helpers import PYTHON


class CheckMdLinksAliasTests(unittest.TestCase):
    def test_forwards_scoped_file_argument(self):
        root = Path(__file__).resolve().parents[3]
        result = subprocess.run(
            [PYTHON, "scripts/ci/check_md_links.py", "docs/START_HERE.md"],
            cwd=root, capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("(1 markdown files scanned)", result.stdout)


if __name__ == "__main__":
    unittest.main()
