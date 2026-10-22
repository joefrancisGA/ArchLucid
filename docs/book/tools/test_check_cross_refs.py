"""Tests for check_cross_refs.py, the gate that keeps chapter, section, step, and appendix references resolvable."""

from __future__ import annotations

import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from check_cross_refs import (
    Targets,
    appendix_problems,
    appendix_targets,
    chapter_problems,
    chapter_targets,
    check_text,
    collect_targets,
    main,
    section_problems,
    step_problems,
)

CHAPTER_4 = "\n".join([
    "# Chapter 4", "", "## 4.1 Why", "", "## 4.3 Becoming another identity", "",
    "**Step 0 - Collect.** Text.", "", "**Step 3a (optional) - More.** Text.", "",
    "```text", "## 4.9 Not a heading inside code", "**Step 9 - Not a step either.**", "```", "",
])
APPENDIX_B = "\n".join(["# Appendix B", "", "## B.3 Role assignments", "", "## B.6 Network", ""])


def targets() -> Targets:
    """Chapters 4 and 5, Appendix B, and a few sections and steps."""
    found = Targets()
    chapter_targets(found, 4, CHAPTER_4)
    chapter_targets(found, 5, "# Chapter 5\n\n## 5.6 Computing\n")
    appendix_targets(found, "B", APPENDIX_B)

    return found


class Collecting(unittest.TestCase):
    def test_chapter_targets_read_sections_and_steps_outside_code(self) -> None:
        found = targets()

        self.assertEqual(found.chapters, {4, 5})
        self.assertEqual(found.sections, {"4.1", "4.3", "5.6"})
        self.assertEqual(found.steps[4], {"0", "3a"})

    def test_appendix_targets_read_lettered_sections(self) -> None:
        found = targets()

        self.assertEqual(found.appendices, {"B"})
        self.assertEqual(found.appendix_sections, {"B.3", "B.6"})

    def test_collect_targets_reads_chapter_and_appendix_files(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "chapters").mkdir()
            (root / "appendices").mkdir()
            (root / "chapters" / "04-identity.md").write_text(CHAPTER_4, encoding="utf-8")
            (root / "appendices" / "b-cookbook.md").write_text(APPENDIX_B, encoding="utf-8")

            found = collect_targets(root)

        self.assertEqual(found.chapters, {4})
        self.assertEqual(found.appendices, {"B"})
        self.assertIn("B.6", found.appendix_sections)


class Chapters(unittest.TestCase):
    def test_existing_chapters_pass(self) -> None:
        self.assertEqual(chapter_problems("Chapter 4 and Chapters 4 and 5.", targets()), (3, []))

    def test_missing_chapter_fails(self) -> None:
        self.assertEqual(chapter_problems("Chapter 12 says so.", targets()), (1, ["no Chapter 12"]))

    def test_every_number_in_a_list_or_range_is_checked(self) -> None:
        count, problems = chapter_problems("Chapters 4, 5, and 9, then Chapters 4 to 7 and 4-8.", targets())

        self.assertEqual(count, 7)
        self.assertEqual(problems, ["no Chapter 9", "no Chapter 7", "no Chapter 8"])


class Sections(unittest.TestCase):
    def test_existing_sections_pass_in_any_case(self) -> None:
        self.assertEqual(section_problems("See section 4.3, and Sections 4.1 and 5.6.", targets()), (3, []))

    def test_missing_section_fails(self) -> None:
        self.assertEqual(section_problems("As section 4.4 says.", targets()), (1, ["no section 4.4"]))

    def test_ranges_check_both_ends(self) -> None:
        self.assertEqual(section_problems("sections 4.1-4.2", targets()), (2, ["no section 4.2"]))

    def test_section_in_the_wrong_chapter_fails(self) -> None:
        count, problems = section_problems("Chapter 4, section 5.6 explains it.", targets())

        self.assertEqual(count, 1)
        self.assertEqual(problems, ["section 5.6 isn't in Chapter 4"])

    def test_section_in_the_named_chapter_passes(self) -> None:
        self.assertEqual(section_problems("Chapter 4, section 4.3 explains it.", targets()), (1, []))


class Steps(unittest.TestCase):
    def test_existing_steps_pass_in_each_phrasing(self) -> None:
        line = "Chapter 4, Step 0; Chapter 4 Step 0; Chapter 4's optional Step 3a; Chapter 4 lab Step 3a."
        count, problems = step_problems(line, targets())

        self.assertEqual(count, 4)
        self.assertEqual(problems, [])

    def test_missing_step_fails(self) -> None:
        self.assertEqual(step_problems("Chapter 4 Step 5's output.", targets()), (1, ["Chapter 4 has no Step 5"]))

    def test_step_in_a_missing_chapter_is_left_to_the_chapter_check(self) -> None:
        self.assertEqual(step_problems("Chapter 12, Step 1.", targets()), (1, []))


class Appendices(unittest.TestCase):
    def test_existing_appendix_and_section_pass(self) -> None:
        self.assertEqual(appendix_problems("Appendix B, section B.6.", targets()), (2, []))

    def test_missing_appendix_and_section_fail(self) -> None:
        count, problems = appendix_problems("Appendix F and B.9.", targets())

        self.assertEqual(count, 2)
        self.assertEqual(problems, ["no Appendix F", "no appendix section B.9"])

    def test_version_numbers_are_not_appendix_sections(self) -> None:
        self.assertEqual(appendix_problems("azurerm 5.9.0 and v1.3.0", targets()), (0, []))


class Files(unittest.TestCase):
    def test_check_text_reports_line_numbers_and_ignores_code(self) -> None:
        text = "Intro.\n\nSee section 4.4.\n\n```python\n# section 9.9\n```\n"
        report = check_text("chapters/07.md", text, targets())

        self.assertEqual(report.problems, ["chapters/07.md:3: no section 4.4"])
        self.assertEqual(report.references, 1)

    def test_main_exits_one_on_problems_and_zero_when_clean(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)

            for name in ("chapters", "appendices", "front-matter", "back-matter"):
                (root / name).mkdir()

            (root / "chapters" / "04-identity.md").write_text(CHAPTER_4, encoding="utf-8")
            (root / "appendices" / "b-cookbook.md").write_text(APPENDIX_B, encoding="utf-8")
            preface = root / "front-matter" / "preface.md"
            preface.write_text("Read section 4.3 and Appendix B, section B.3.\n", encoding="utf-8")

            with contextlib.redirect_stdout(io.StringIO()) as clean:
                clean_code = main(["--book-root", folder])

            preface.write_text("Read section 4.4.\n", encoding="utf-8")

            with contextlib.redirect_stdout(io.StringIO()) as broken:
                broken_code = main(["--book-root", folder])

        self.assertEqual(clean_code, 0)
        self.assertIn("0 problem(s)", clean.getvalue())
        self.assertEqual(broken_code, 1)
        self.assertIn("front-matter/preface.md:1: no section 4.4", broken.getvalue())


if __name__ == "__main__":
    unittest.main()
