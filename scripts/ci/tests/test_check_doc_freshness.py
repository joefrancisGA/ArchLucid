import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import check_doc_freshness as sut


class CheckDocFreshnessTests(unittest.TestCase):
    def test_future_review_date_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            runbooks = root / "docs" / "runbooks"
            runbooks.mkdir(parents=True)
            (runbooks / "future.md").write_text("**Last reviewed:** 2099-01-01\n", encoding="utf-8")
            output = io.StringIO()
            with patch.object(sut, "repo_root", return_value=root), contextlib.redirect_stdout(output):
                result = sut.main()
            self.assertEqual(result, 0)
            self.assertIn("future.md", output.getvalue())
            self.assertIn("future", output.getvalue().lower())

    def test_invalid_calendar_date_warns_instead_of_crashing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            runbooks = root / "docs" / "runbooks"
            runbooks.mkdir(parents=True)
            (runbooks / "bad.md").write_text("**Last reviewed:** 2026-02-30\n", encoding="utf-8")
            output = io.StringIO()
            with patch.object(sut, "repo_root", return_value=root), contextlib.redirect_stdout(output):
                result = sut.main()
            self.assertEqual(result, 0)
            self.assertIn("bad.md", output.getvalue())


if __name__ == "__main__":
    unittest.main()
