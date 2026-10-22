"""Tests for check_kql_listings.py, the structure check for the book's KQL listings."""

from __future__ import annotations

import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from check_kql_listings import (
    balance_problems,
    check_text,
    kql_files,
    main,
    mask,
    mask_line,
    start_problems,
    statements,
)


class Masking(unittest.TestCase):
    def test_comment_is_removed(self) -> None:
        self.assertEqual(mask_line("resources // count (them"), ("resources ", False))

    def test_comment_marker_inside_string_is_kept_as_string(self) -> None:
        self.assertEqual(mask_line("where id has '//x('"), ("where id has '    '", False))

    def test_escaped_quote_does_not_close_string(self) -> None:
        self.assertEqual(mask_line(r"print 'it\'s'"), ("print '     '", False))

    def test_verbatim_string_keeps_backslash_literal(self) -> None:
        self.assertEqual(mask_line(r"print @'C:\x'"), ("print @'    '", False))

    def test_open_string_is_reported(self) -> None:
        self.assertEqual(mask_line('print "abc'), ('print "   ', True))

    def test_mask_joins_lines_and_flags_any_open_string(self) -> None:
        self.assertEqual(mask("a\nb"), ("a\nb", False))
        self.assertTrue(mask("a\n'b")[1])


class Structure(unittest.TestCase):
    def test_balance(self) -> None:
        self.assertEqual(balance_problems("f([{}])"), [])
        self.assertEqual(balance_problems("f(]"), ["unexpected ']'"])
        self.assertEqual(balance_problems(")"), ["unexpected ')'"])
        self.assertEqual(balance_problems("f(["), ["unclosed bracket, expected ']'"])

    def test_statements(self) -> None:
        self.assertEqual(statements("let a = 1;\n resources ;  ; "), ["let a = 1", "resources"])

    def test_start_accepts_lets_then_known_table(self) -> None:
        self.assertEqual(start_problems("let a = 1;\nresources | take 1"), [])

    def test_start_problems(self) -> None:
        self.assertEqual(start_problems("   "), ["empty query"])
        self.assertEqual(start_problems("print 1;\nresources"), ["only 'let' statements may come before the query"])
        self.assertEqual(start_problems("| take 1"), ["starts with '|': a fragment, not a query"])
        self.assertEqual(start_problems("SigninLogs"), ["starts with 'SigninLogs', which is not a known table"])
        self.assertEqual(start_problems("(resources)"), ["starts with '(', which is not a known table"])

    def test_check_text_collects_every_kind(self) -> None:
        self.assertEqual(check_text("resources\n| where name == 'x'"), [])
        self.assertEqual(check_text("resources | where name == 'x"), ["unterminated string"])


class Main(unittest.TestCase):
    def run_main(self, files: dict[str, str]) -> tuple[int, str, list[str]]:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)

            for name, text in files.items():
                (root / name).parent.mkdir(parents=True, exist_ok=True)
                (root / name).write_text(text, encoding="utf-8")

            output = io.StringIO()

            with contextlib.redirect_stdout(output):
                code = main(["--book-root", str(root)])

            found = [path.relative_to(root).as_posix() for path in kql_files(root)]

        return code, output.getvalue(), found

    def test_passes_and_scans_both_folders(self) -> None:
        code, output, found = self.run_main({"lab/listings/kql/a.kql": "resources",
                                             "lab/queries/b.kql": "AuditLogs | take 1",
                                             "lab/queries/notes.txt": "ignored"})

        self.assertEqual(code, 0)
        self.assertEqual(found, ["lab/listings/kql/a.kql", "lab/queries/b.kql"])
        self.assertIn("check_kql_listings: 2 file(s), 0 problem(s)", output)

    def test_fails_with_location(self) -> None:
        code, output, _ = self.run_main({"lab/listings/kql/a.kql": "| take 1"})

        self.assertEqual(code, 1)
        self.assertIn("lab/listings/kql/a.kql: starts with '|'", output)


if __name__ == "__main__":
    unittest.main()
