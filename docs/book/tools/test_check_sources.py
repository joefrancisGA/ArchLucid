"""Tests for check_sources.py, the gate that keeps inline [Sn] citations and Sources sections in step."""

from __future__ import annotations

import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from check_sources import check_text, cited_numbers, entry_problems, main, paragraphs, prose_lines, split_sources

ENTRY_1 = ("- **[S1]** Azure RBAC overview. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/"
           "overview> Checked 2026-10-12. Kind: documented.")
ENTRY_2 = ("- **[S2]** Inheritance. Microsoft Learn. <https://learn.microsoft.com/x> Checked 2026-10-12. "
           "Version: 2022-04-01. Kind: inference.")


def chapter(*body: str, sources: tuple[str, ...] = (ENTRY_1,)) -> str:
    """A small chapter with ``body`` lines, a Sources section, and a Summary after it."""
    return "\n".join(["# Chapter", "", *body, "", "## Sources", "", *sources, "", "## Summary", "", "- Done."]) + "\n"


class Parsing(unittest.TestCase):
    def test_cited_numbers_reads_single_and_grouped_citations(self) -> None:
        self.assertEqual(cited_numbers("Roles inherit [S1]. Conditions [S2, S3] and [S1]."), [1, 2, 3, 1])

    def test_cited_numbers_ignores_other_bracket_ids(self) -> None:
        self.assertEqual(cited_numbers("Pack items [N1] and [G2] aren't sources."), [])

    def test_prose_lines_skips_fenced_code(self) -> None:
        lines = ["before [S1]", "```json", '{"citation": "[S9]"}', "```", "after"]

        self.assertEqual(prose_lines(lines), [(1, "before [S1]"), (5, "after")])

    def test_split_sources_ends_the_section_at_the_next_heading(self) -> None:
        body, sources = split_sources([(1, "text"), (2, "## Sources"), (3, "- entry"), (4, "## Summary"), (5, "x")])

        self.assertEqual(body, [(1, "text"), (4, "## Summary"), (5, "x")])
        self.assertEqual(sources, [(3, "- entry")])

    def test_split_sources_keeps_subheadings_inside_the_section(self) -> None:
        _, sources = split_sources([(1, "## Sources"), (2, "### Azure"), (3, "- entry")])

        self.assertEqual(sources, [(2, "### Azure"), (3, "- entry")])

    def test_paragraphs_join_runs_of_non_blank_lines(self) -> None:
        found = paragraphs([(1, "a"), (2, "b"), (3, ""), (4, "c")])

        self.assertEqual(found, [(1, "a b"), (4, "c")])

    def test_entry_problems_lists_each_missing_field(self) -> None:
        problems = entry_problems("ch.md:9", 4, "A title with nothing else.")

        self.assertEqual(len(problems), 3)
        self.assertTrue(all(problem.startswith("ch.md:9: [S4] lacks") for problem in problems))

    def test_entry_problems_rejects_an_unknown_kind(self) -> None:
        problems = entry_problems("ch.md:9", 1, "<https://x.example> Checked 2026-10-12. Kind: hearsay.")

        self.assertEqual(problems, ["ch.md:9: [S1] lacks 'Kind: documented|lab-tested|inference'"])


class CheckText(unittest.TestCase):
    def test_matching_citations_and_entries_pass(self) -> None:
        report = check_text("ch.md", chapter("Roles inherit down the hierarchy [S1]."))

        self.assertEqual(report.problems, [])
        self.assertEqual((report.cited, report.defined), ({1}, {1}))

    def test_citation_without_entry_fails(self) -> None:
        report = check_text("ch.md", chapter("Roles inherit [S1]. Conditions apply [S2]."))

        self.assertEqual(report.problems, ["ch.md: [S2] is cited but has no Sources entry"])

    def test_entry_never_cited_fails(self) -> None:
        report = check_text("ch.md", chapter("Roles inherit [S1].", sources=(ENTRY_1, ENTRY_2)))

        self.assertEqual(report.problems, ["ch.md: [S2] is in Sources but never cited"])

    def test_duplicate_entry_fails(self) -> None:
        report = check_text("ch.md", chapter("Roles inherit [S1].", sources=(ENTRY_1, ENTRY_1)))

        self.assertEqual(report.problems, ["ch.md:8: [S1] is defined twice"])

    def test_incomplete_entry_fails(self) -> None:
        report = check_text("ch.md", chapter("Roles inherit [S1].", sources=("- **[S1]** Title only.",)))

        self.assertEqual(len(report.problems), 3)

    def test_citation_in_code_doesnt_count(self) -> None:
        report = check_text("ch.md", chapter("```text", "[S1]", "```"))

        self.assertEqual(report.problems, ["ch.md: [S1] is in Sources but never cited"])

    def test_citation_inside_sources_section_doesnt_count(self) -> None:
        report = check_text("ch.md", chapter("No citations here.", sources=(ENTRY_1 + " See also [S1].",)))

        self.assertEqual(report.problems, ["ch.md: [S1] is in Sources but never cited"])

    def test_file_without_citations_or_sources_passes(self) -> None:
        report = check_text("ch.md", "# Chapter\n\nPlain prose.\n")

        self.assertEqual((report.problems, report.warnings), ([], []))

    def test_uncited_as_of_note_warns(self) -> None:
        report = check_text("ch.md", chapter("Roles inherit [S1].", "", "> **As of 2026-10:** Something changed."))

        self.assertEqual(report.problems, [])
        self.assertEqual(report.warnings, ["ch.md:5: 'As of' note with no source citation"])

    def test_cited_as_of_note_passes(self) -> None:
        report = check_text("ch.md", chapter("> **As of 2026-10:** Roles inherit [S1]."))

        self.assertEqual(report.warnings, [])


class Main(unittest.TestCase):
    def run_main(self, files: dict[str, str]) -> tuple[int, str]:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)

            for name, text in files.items():
                (root / name).parent.mkdir(parents=True, exist_ok=True)
                (root / name).write_text(text, encoding="utf-8")

            output = io.StringIO()

            with contextlib.redirect_stdout(output):
                code = main(["--book-root", str(root)])

        return code, output.getvalue()

    def test_clean_book_exits_zero(self) -> None:
        code, output = self.run_main({"chapters/01.md": chapter("Roles inherit [S1].")})

        self.assertEqual(code, 0)
        self.assertIn("check_sources: 1 source(s), 0 problem(s), 0 warning(s)", output)

    def test_problem_exits_one_and_warnings_print(self) -> None:
        code, output = self.run_main({
            "chapters/01.md": chapter("Roles inherit [S1] [S5]."),
            "appendices/a.md": "# A\n\n> **As of 2026-10:** Unsourced.\n",
        })

        self.assertEqual(code, 1)
        self.assertIn("chapters/01.md: [S5] is cited but has no Sources entry", output)
        self.assertIn("warning: appendices/a.md:3: 'As of' note with no source citation", output)


if __name__ == "__main__":
    unittest.main()
