"""Unit tests for ``check_concept_vocabulary.find_violations``.

Run with::

    python -m unittest scripts/ci/test_check_concept_vocabulary.py
"""

from __future__ import annotations

import pathlib
import re
import tempfile
import unittest

from check_concept_vocabulary import (
    EXCLUDED_RELATIVE_PATHS,
    RULES,
    VocabularyRule,
    find_violations,
)


def _make_repo_with_docs(tmp_root: pathlib.Path) -> pathlib.Path:
    docs_dir = tmp_root / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    return docs_dir


class FindViolationsTests(unittest.TestCase):
    def test_empty_docs_returns_empty(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            _make_repo_with_docs(root)

            result = find_violations(root, RULES)

            self.assertEqual([], result)

    def test_finds_azure_ad_violation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            (docs / "policy.md").write_text("Use Azure AD for the webhook tenant.\n", encoding="utf-8")

            result = find_violations(root, RULES)

            self.assertEqual(1, len(result))
            self.assertEqual("Azure AD", result[0].matched_text)
            self.assertEqual(1, result[0].line_number)

    def test_finds_azure_active_directory_violation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            (docs / "policy.md").write_text("Configure Azure Active Directory tenant id.\n", encoding="utf-8")

            result = find_violations(root, RULES)

            self.assertEqual(1, len(result))
            self.assertEqual("Azure Active Directory", result[0].matched_text)

    def test_skips_archive_subdirectory(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            archive = docs / "archive"
            archive.mkdir()
            (archive / "history.md").write_text("Historical Azure AD references kept verbatim.\n", encoding="utf-8")

            result = find_violations(root, RULES)

            self.assertEqual([], result)

    def test_skips_concepts_md_self(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            (docs / "CONCEPTS.md").write_text(
                "Don't write Azure AD or Azure Active Directory; use Microsoft Entra ID.\n",
                encoding="utf-8",
            )

            result = find_violations(root, RULES)

            self.assertEqual([], result)

    def test_does_not_match_partial_words(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            (docs / "policy.md").write_text(
                "Azure ADX clusters and AzureADStudio are unrelated and should not match.\n",
                encoding="utf-8",
            )

            result = find_violations(root, RULES)

            self.assertEqual([], result)

    def test_collects_violations_across_multiple_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            (docs / "a.md").write_text("Azure AD reference here.\n", encoding="utf-8")
            (docs / "b.md").write_text("Configure Azure Active Directory.\n", encoding="utf-8")

            result = find_violations(root, RULES)

            self.assertEqual(2, len(result))
            file_names = sorted(v.path.name for v in result)
            self.assertEqual(["a.md", "b.md"], file_names)

    def test_returns_correct_line_numbers(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            (docs / "policy.md").write_text(
                "Line 1.\nLine 2.\nAzure AD on line 3.\nLine 4.\n",
                encoding="utf-8",
            )

            result = find_violations(root, RULES)

            self.assertEqual(1, len(result))
            self.assertEqual(3, result[0].line_number)

    def test_empty_rules_returns_empty(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            (docs / "policy.md").write_text("Azure AD everywhere.\n", encoding="utf-8")

            result = find_violations(root, [])

            self.assertEqual([], result)

    def test_custom_rule_with_word_boundary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            docs = _make_repo_with_docs(root)
            (docs / "policy.md").write_text(
                "OK: foobar is fine. Bad: legacyterm appears here. Also legacytermish should not match.\n",
                encoding="utf-8",
            )

            custom_rule = VocabularyRule(
                canonical="newterm",
                rejected_pattern=re.compile(r"\blegacyterm\b"),
                docs_concepts_row=999,
                rationale="Synthetic test rule.",
                fix_hint='Replace "legacyterm" with "newterm".',
            )

            result = find_violations(root, [custom_rule])

            self.assertEqual(1, len(result))
            self.assertEqual("legacyterm", result[0].matched_text)

    def test_raises_on_missing_root(self) -> None:
        with self.assertRaises(FileNotFoundError):
            find_violations(pathlib.Path("/no/such/repo/12345"), RULES)

    def test_raises_on_missing_docs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            with self.assertRaises(FileNotFoundError):
                find_violations(root, RULES)


if __name__ == "__main__":
    unittest.main()
