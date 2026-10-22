"""Paragraph styles: proportional serif body, sans-serif headings, monospace code."""

from __future__ import annotations

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle

from bookpdf.fonts import BODY_FONT, HEADING_FONT

INK = colors.HexColor("#1A1A1A")
HEADING_INK = colors.HexColor("#1F3A5F")
MUTED_INK = colors.HexColor("#555555")
LINK_INK = "#1F4E79"
RULE = colors.HexColor("#C8D2DC")
CODE_BACKGROUND = colors.HexColor("#F5F5F5")
QUOTE_BACKGROUND = colors.HexColor("#F2F6F9")
TABLE_HEADER_BACKGROUND = colors.HexColor("#E3ECF3")

BODY_SIZE = 10
BODY_LEADING = 13.5
CODE_SIZE = 7.6
CODE_LEADING = 9.4
CODE_PADDING = 6


class BookStyles:
    """Every paragraph style the renderer and the document template use."""

    def __init__(self, code_font_name: str) -> None:
        if not code_font_name:
            raise ValueError("code_font_name is required")

        self.code_font_name = code_font_name
        self.body = ParagraphStyle(
            "BookBody", fontName=BODY_FONT, fontSize=BODY_SIZE, leading=BODY_LEADING,
            textColor=INK, alignment=TA_LEFT, spaceAfter=6,
        )
        self.list_item = ParagraphStyle("BookListItem", parent=self.body, spaceAfter=2)
        self.quote = ParagraphStyle(
            "BookQuote", parent=self.body, fontSize=9.5, leading=12.8, leftIndent=10, rightIndent=6,
            borderPadding=(5, 6, 5, 6), backColor=QUOTE_BACKGROUND, spaceBefore=4, spaceAfter=10,
        )
        self.h1 = ParagraphStyle(
            "BookH1", fontName=HEADING_FONT, fontSize=20, leading=24, textColor=HEADING_INK,
            spaceBefore=6, spaceAfter=14, keepWithNext=True,
        )
        self.h2 = ParagraphStyle(
            "BookH2", fontName=HEADING_FONT, fontSize=13.5, leading=17, textColor=HEADING_INK,
            spaceBefore=14, spaceAfter=6, keepWithNext=True,
        )
        self.h3 = ParagraphStyle(
            "BookH3", fontName=HEADING_FONT, fontSize=11, leading=14, textColor=INK,
            spaceBefore=10, spaceAfter=4, keepWithNext=True,
        )
        self.code = ParagraphStyle(
            "BookCode", fontName=code_font_name, fontSize=CODE_SIZE, leading=CODE_LEADING, textColor=INK,
            backColor=CODE_BACKGROUND, borderPadding=CODE_PADDING, leftIndent=CODE_PADDING,
            rightIndent=CODE_PADDING, spaceBefore=6, spaceAfter=12,
        )
        self.table_cell = ParagraphStyle("BookCell", parent=self.body, fontSize=8.6, leading=11, spaceAfter=0)
        self.table_header = ParagraphStyle("BookHeaderCell", parent=self.table_cell, fontName="Times-Bold")
        self.cover_title = ParagraphStyle(
            "BookCoverTitle", fontName=HEADING_FONT, fontSize=28, leading=34, alignment=TA_CENTER,
            textColor=HEADING_INK, spaceAfter=16,
        )
        self.cover_subtitle = ParagraphStyle(
            "BookCoverSubtitle", parent=self.body, fontSize=14, leading=19, alignment=TA_CENTER,
            textColor=MUTED_INK, spaceAfter=28,
        )
        self.cover_note = ParagraphStyle(
            "BookCoverNote", parent=self.body, fontSize=9.5, leading=13, alignment=TA_CENTER, textColor=MUTED_INK,
        )
        self.contents_title = ParagraphStyle("BookContentsTitle", parent=self.h1)
        self.toc_levels = [
            ParagraphStyle(
                "BookToc1", fontName="Times-Bold", fontSize=10.5, leading=14, leftIndent=0,
                firstLineIndent=0, spaceBefore=5, textColor=INK,
            ),
            ParagraphStyle(
                "BookToc2", fontName=BODY_FONT, fontSize=9.5, leading=12, leftIndent=16,
                firstLineIndent=0, textColor=INK,
            ),
        ]

    def heading(self, level: int) -> ParagraphStyle:
        """Style for an HTML heading level; h4 to h6 share the h3 style."""
        if level <= 1:
            return self.h1

        if level == 2:
            return self.h2

        return self.h3
