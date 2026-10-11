"""Assemble the story (cover, contents, book files) and write the PDF."""

from __future__ import annotations

import re
from datetime import date
from pathlib import Path

from markdown import markdown
from reportlab.lib.units import inch
from reportlab.platypus import Flowable, PageBreak, Paragraph, Spacer
from reportlab.platypus.tableofcontents import TableOfContents

from bookpdf.document import BookDocTemplate
from bookpdf.fonts import CodeFont, font_safe_markup, register_code_font, winansi_has
from bookpdf.html_tree_builder import parse_html
from bookpdf.renderer import FlowableRenderer
from bookpdf.sources import clean_markdown
from bookpdf.styles import BookStyles

MARKDOWN_EXTENSIONS = ["fenced_code", "tables", "sane_lists"]
AUTHOR = "Joe Francis"


def first_heading(text: str, fallback: str) -> str:
    """The file's ``# `` heading, used to name it on the cover."""
    match = re.search(r"^# (.+)$", text or "", re.MULTILINE)

    return match.group(1).strip() if match else fallback


def excluded_note(excluded: list[Path]) -> str | None:
    """Cover line naming unfinished files left out of this draft."""
    if not excluded:
        return None

    names = [first_heading(path.read_text(encoding="utf-8"), path.name) for path in excluded]

    return "Not in this draft (still waiting on author input): " + "; ".join(names) + "."


def cover(styles: BookStyles, code_font: CodeFont, title: str, subtitle: str | None, generated: date,
          excluded: list[Path]) -> list[Flowable]:
    """Title page."""
    story: list[Flowable] = [
        Spacer(1, 2.0 * inch),
        Paragraph(font_safe_markup(title, winansi_has, code_font), styles.cover_title),
    ]

    if subtitle:
        story.append(Paragraph(font_safe_markup(subtitle, winansi_has, code_font), styles.cover_subtitle))

    story.append(Paragraph(f"Draft \u2014 generated {generated.isoformat()}", styles.cover_note))
    note = excluded_note(excluded)

    if note:
        story.extend([Spacer(1, 0.25 * inch), Paragraph(font_safe_markup(note, winansi_has, code_font), styles.cover_note)])

    return story


def contents(styles: BookStyles) -> list[Flowable]:
    """Contents page, filled in by ``multiBuild`` from the headings' TOCEntry notifications."""
    toc = TableOfContents()
    toc.levelStyles = styles.toc_levels
    toc.dotsMinLevel = 0

    return [Paragraph("Contents", styles.contents_title), toc]


def book_story(files: list[Path], renderer: FlowableRenderer, width: float) -> list[Flowable]:
    """Every book file rendered in order, each starting on a new page."""
    story: list[Flowable] = []

    for path in files:
        html = markdown(clean_markdown(path.read_text(encoding="utf-8")), extensions=MARKDOWN_EXTENSIONS)
        story.append(PageBreak())
        story.extend(renderer.render(parse_html(html), width))

    return story


def build_pdf(files: list[Path], excluded: list[Path], out: Path, title: str, subtitle: str | None,
              generated: date) -> int:
    """Write the PDF to ``out`` and return its page count."""
    if not files:
        raise ValueError("no book files to render")

    code_font = register_code_font()
    styles = BookStyles(code_font.name)
    out.parent.mkdir(parents=True, exist_ok=True)
    doc = BookDocTemplate(str(out), short_title=title, title=title, author=AUTHOR, subject=subtitle or "",
                          invariant=True)
    renderer = FlowableRenderer(styles, code_font)
    story = cover(styles, code_font, title, subtitle, generated, excluded)
    story += [PageBreak(), *contents(styles)]
    story += book_story(files, renderer, doc.width)
    doc.multiBuild(story)

    return doc.page
