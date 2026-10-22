"""Unit tests for evergreen.error_excerpt."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.error_excerpt import ErrorExcerptExtractor  # noqa: E402

_LOG = "\n".join(
    [
        "2026-10-05T17:24:35.2901796Z Current runner version: '2.337.0'",
        "2026-10-05T17:24:48.6162715Z   \x1b[36;1mecho \"failed=()\"\x1b[0m",
        "2026-10-05T17:24:53.9957684Z Finding:     ...AccountKey=\x1b[1;3;mREDACTED\x1b[0m\"",
        "2026-10-05T17:24:54.0026397Z RuleID:      generic-api-key",
        "2026-10-05T17:25:08.0354718Z \x1b[90m5:25PM\x1b[0m \x1b[33mWRN\x1b[0m \x1b[1mleaks found: 1\x1b[0m",
        "2026-10-05T17:25:08.0449771Z ##[warning]GitLeaks encountered leaks",
        "2026-10-05T19:51:51.6487913Z ##[error]/home/runner/work/A/A/X.cs(55,39): error ARCH006: unscoped",
        "2026-10-05T19:51:51.6487913Z ##[error]/home/runner/work/A/A/X.cs(55,39): error ARCH006: unscoped",
        "2026-10-05T19:51:52.0000000Z   Failed Tests.Foo.Bar [12 ms]",
        "2026-10-05T19:51:52.0000000Z fail-on-error: true",
        "2026-10-05T19:51:52.0000000Z npm ERR! code ELIFECYCLE",
        "",
    ]
)


class TestErrorExcerptExtractor(unittest.TestCase):
    def test_extracts_error_bearing_lines_without_timestamps_or_ansi(self) -> None:
        lines = ErrorExcerptExtractor().extract(_LOG)

        self.assertEqual(
            lines,
            [
                'Finding:     ...AccountKey=REDACTED"',
                "RuleID:      generic-api-key",
                "5:25PM WRN leaks found: 1",
                "##[warning]GitLeaks encountered leaks",
                "##[error]/home/runner/work/A/A/X.cs(55,39): error ARCH006: unscoped",
                "Failed Tests.Foo.Bar [12 ms]",
                "npm ERR! code ELIFECYCLE",
            ],
        )

    def test_ignores_lower_case_failed_in_echoed_shell_and_option_names(self) -> None:
        lines = ErrorExcerptExtractor().extract("x failed=()\nfail-on-error: true\ncontinue-on-error: false")

        self.assertEqual(lines, [])

    def test_caps_line_count_and_length(self) -> None:
        log = "\n".join(f"##[error]line {i} " + "x" * 500 for i in range(10))

        lines = ErrorExcerptExtractor(max_lines=3, max_line_length=20).extract(log)

        self.assertEqual(len(lines), 3)
        self.assertTrue(all(len(line) == 20 for line in lines))

    def test_rejects_non_positive_limits(self) -> None:
        with self.assertRaises(ValueError):
            ErrorExcerptExtractor(max_lines=0)

        with self.assertRaises(ValueError):
            ErrorExcerptExtractor(max_line_length=0)

    def test_empty_log_yields_empty_list(self) -> None:
        self.assertEqual(ErrorExcerptExtractor().extract(""), [])


if __name__ == "__main__":
    unittest.main()
