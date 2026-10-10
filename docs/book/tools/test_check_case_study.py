"""Unit tests for check_case_study.py (run with: python -m unittest discover -s docs/book/tools)."""

import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_case_study as checker  # noqa: E402  (path set above so the test runs from any directory)


def levels(text: str, publish: bool = False) -> list[tuple[str, str]]:
    return [(finding.level, finding.message) for finding in checker.scan(text, publish)]


def run_main(text: str | None, *extra: str) -> tuple[int, str]:
    """Run main() against a temp file (or a missing path when text is None) and capture stdout."""
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp, "appendix.md")

        if text is not None:
            path.write_text(text, encoding="utf-8")

        out = io.StringIO()

        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(io.StringIO()):
            code = checker.main([str(path), *extra])

        return code, out.getvalue()


class IdentifierErrors(unittest.TestCase):
    def test_guid_is_error(self) -> None:
        self.assertEqual(levels("tenant 72f988bf-86f1-41af-91ab-2d7cd011db47")[0][0], checker.ERROR)

    def test_public_ipv4_is_error(self) -> None:
        self.assertEqual(levels("host 52.168.10.4")[0][0], checker.ERROR)

    def test_public_ipv6_is_error(self) -> None:
        self.assertEqual(levels("resolver 2606:4700:4700::1111")[0][0], checker.ERROR)

    def test_foreign_email_is_error(self) -> None:
        self.assertEqual(levels("mail jane.doe@realcorp.com")[0][0], checker.ERROR)

    def test_tenant_domain_is_error(self) -> None:
        self.assertEqual(levels("contoso-prod.onmicrosoft.com")[0][0], checker.ERROR)

    def test_named_service_endpoints_are_errors(self) -> None:
        for text in ("custprod01.blob.core.windows.net", "kv-prod.vault.azure.net", "payapi.azurewebsites.net"):
            with self.subTest(text=text):
                self.assertEqual(levels(text)[0][0], checker.ERROR)

    def test_backlog_ids_are_errors(self) -> None:
        self.assertEqual([level for level, _ in levels("SN-1 TB-22 FR-333")], [checker.ERROR] * 3)


class ReviewItems(unittest.TestCase):
    def test_private_ipv4_is_review(self) -> None:
        self.assertEqual(levels("spoke 10.20.0.0/16")[0][0], checker.REVIEW)

    def test_private_ipv6_is_review(self) -> None:
        self.assertEqual(levels("ula fd00::1")[0][0], checker.REVIEW)

    def test_product_name_is_review(self) -> None:
        self.assertEqual(levels("SecureNow helped")[0][0], checker.REVIEW)

    def test_percentage_is_review(self) -> None:
        self.assertEqual(levels("85% fewer paths")[0][0], checker.REVIEW)


class AllowedText(unittest.TestCase):
    def test_documentation_ranges_and_example_email_pass(self) -> None:
        text = "203.0.113.7 198.51.100.1 192.0.2.10 2001:db8::1 lab@example.com"
        self.assertEqual(levels(text), [])

    def test_privatelink_zone_and_wildcards_pass(self) -> None:
        text = "privatelink.blob.core.windows.net, *.onmicrosoft.com, <account>.blob.core.windows.net"
        self.assertEqual(levels(text), [])

    def test_times_and_invalid_addresses_pass(self) -> None:
        self.assertEqual(levels("at 10:30:45, version 999.1.1.1"), [])


class Placeholders(unittest.TestCase):
    TEXT = "Industry: [[OWNER: fill in]]\nSize: [[OWNER]]\n"

    def test_draft_mode_allows_placeholders(self) -> None:
        self.assertEqual(levels(self.TEXT), [])

    def test_publish_mode_fails_placeholders(self) -> None:
        self.assertEqual([level for level, _ in levels(self.TEXT, publish=True)], [checker.ERROR] * 2)

    def test_count_placeholders(self) -> None:
        self.assertEqual(checker.count_placeholders(self.TEXT), 2)


class MainExitCodes(unittest.TestCase):
    def test_clean_file_exits_zero(self) -> None:
        code, out = run_main("Nothing identifying here.\n")
        self.assertEqual(code, 0)
        self.assertIn("0 error(s)", out)

    def test_error_exits_one(self) -> None:
        code, out = run_main("host 52.168.10.4\n")
        self.assertEqual(code, 1)
        self.assertIn("public IP address", out)

    def test_review_only_exits_zero(self) -> None:
        code, _ = run_main("SecureNow\n")
        self.assertEqual(code, 0)

    def test_publish_with_placeholder_exits_one(self) -> None:
        code, _ = run_main("[[OWNER]]\n", "--publish")
        self.assertEqual(code, 1)

    def test_missing_file_exits_two(self) -> None:
        code, _ = run_main(None)
        self.assertEqual(code, 2)


class Appendix(unittest.TestCase):
    def test_scaffold_has_no_errors_in_draft_mode(self) -> None:
        appendix = Path(__file__).resolve().parents[1] / "appendices" / "d-case-study.md"
        findings = checker.scan(appendix.read_text(encoding="utf-8"), publish=False)
        self.assertEqual([f for f in findings if f.level == checker.ERROR], [])


if __name__ == "__main__":
    unittest.main()
