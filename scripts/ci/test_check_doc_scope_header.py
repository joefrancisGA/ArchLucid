"""Unit tests for scripts/ci/check_doc_scope_header.py."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import check_doc_scope_header as subject


class CheckDocScopeHeaderTests(unittest.TestCase):
    def test_docs_header_passes_blockquote(self) -> None:
        text = "> **Scope:** Test doc.\n\n# Title\n"

        self.assertTrue(subject.has_valid_docs_scope_header(text))

    def test_docs_header_passes_blockquote_whitespace(self) -> None:
        text = "  >  **Scope:**  Indented OK.\n# Title\n"

        self.assertTrue(subject.has_valid_docs_scope_header(text))

    def test_docs_header_passes_after_bom_and_blank_lines(self) -> None:
        text = "\ufeff\n\n> **Scope:** After BOM and blanks.\n"

        self.assertTrue(subject.has_valid_docs_scope_header(text))

    def test_docs_header_fails_when_heading_first(self) -> None:
        text = "# Title first\n\n> **Scope:** Too late.\n"

        self.assertFalse(subject.has_valid_docs_scope_header(text))

    def test_docs_header_fails_when_empty(self) -> None:
        self.assertFalse(subject.has_valid_docs_scope_header(""))
        self.assertFalse(subject.has_valid_docs_scope_header("   \n  \n"))

    def test_readme_accepts_html_comment(self) -> None:
        text = "<!-- **Scope:** Repo readme. -->\n\n# ArchLucid\n"

        self.assertTrue(subject.has_valid_readme_scope_header(text))

    def test_readme_accepts_blockquote(self) -> None:
        text = "> **Scope:** Blockquote style also OK.\n# X\n"

        self.assertTrue(subject.has_valid_readme_scope_header(text))

    def test_readme_rejects_plain_title(self) -> None:
        text = "# ArchLucid\n"

        self.assertFalse(subject.has_valid_readme_scope_header(text))

    def test_iter_respects_exclude_archive(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "docs"
            root.mkdir(parents=True)
            (root / "ok.md").write_text("> **Scope:** A\n", encoding="utf-8")
            arch = root / "archive" / "old.md"
            arch.parent.mkdir(parents=True)
            arch.write_text("# no scope\n", encoding="utf-8")

            found = subject.iter_markdown_files(root, exclude_archive=True)

            self.assertEqual(len(found), 1)
            self.assertTrue(found[0].name == "ok.md")

            found_all = subject.iter_markdown_files(root, exclude_archive=False)

            self.assertEqual(len(found_all), 2)


if __name__ == "__main__":
    unittest.main()
