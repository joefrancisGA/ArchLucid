"""Turn an :class:`HtmlNode` tree into ReportLab flowables."""

from __future__ import annotations

from xml.sax.saxutils import escape

from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import Flowable, ListFlowable, ListItem, Paragraph, Table, XPreformatted
from reportlab.platypus.flowables import HRFlowable

from bookpdf.code_wrap import wrap_code
from bookpdf.fonts import BODY_FONT, CodeFont, font_safe_markup, winansi_has
from bookpdf.html_node import HtmlNode
from bookpdf.styles import CODE_PADDING, CODE_SIZE, LINK_INK, RULE, TABLE_HEADER_BACKGROUND, BookStyles
from bookpdf.tables import column_widths

INLINE_TAGS = frozenset({"a", "b", "br", "code", "em", "i", "img", "span", "strong", "sub", "sup"})
HEADING_TAGS = {"h1": 1, "h2": 2, "h3": 3, "h4": 4, "h5": 5, "h6": 6}
CONTENTS_DEPTH = 2
LIST_INDENT = 16
QUOTE_INDENT = 16


class FlowableRenderer:
    """Renders one book's worth of HTML. Heading keys are numbered across files so links stay unique."""

    def __init__(self, styles: BookStyles, code_font: CodeFont) -> None:
        if styles is None or code_font is None:
            raise ValueError("styles and code_font are required")

        self.styles = styles
        self.code_font = code_font
        self._heading_count = 0

    def render(self, root: HtmlNode, width: float) -> list[Flowable]:
        """Flowables for every block under ``root``, laid out for a frame ``width`` points wide."""
        return self._render_children(root, width, self.styles.body)

    # Blocks -------------------------------------------------------------------------------------

    def _render_children(self, node: HtmlNode, width: float, paragraph_style) -> list[Flowable]:
        """Render child blocks in order; runs of loose inline content become one paragraph."""
        flowables: list[Flowable] = []
        inline_run: list[HtmlNode | str] = []

        for child in node.children:
            if isinstance(child, str) or child.tag in INLINE_TAGS:
                inline_run.append(child)
                continue

            flowables.extend(self._flush_inline(inline_run, paragraph_style))
            inline_run = []
            flowables.extend(self._render_block(child, width, paragraph_style))

        flowables.extend(self._flush_inline(inline_run, paragraph_style))

        return flowables

    def _flush_inline(self, run: list[HtmlNode | str], paragraph_style) -> list[Flowable]:
        markup = "".join(self._inline(child) for child in run).strip()

        return [Paragraph(markup, paragraph_style)] if markup else []

    def _render_block(self, node: HtmlNode, width: float, paragraph_style) -> list[Flowable]:
        if node.tag in HEADING_TAGS:
            return [self._heading(node, HEADING_TAGS[node.tag])]

        if node.tag == "p":
            return self._flush_inline(node.children, paragraph_style)

        if node.tag in ("ul", "ol"):
            return [self._list(node, width)]

        if node.tag == "pre":
            return [self._code(node, width)]

        if node.tag == "blockquote":
            return self._render_children(node, width - QUOTE_INDENT, self.styles.quote)

        if node.tag == "table":
            return [self._table(node, width)]

        if node.tag == "hr":
            return [HRFlowable(width="100%", thickness=0.6, color=RULE, spaceBefore=6, spaceAfter=10)]

        return self._render_children(node, width, paragraph_style)

    def _heading(self, node: HtmlNode, level: int) -> Paragraph:
        paragraph = Paragraph(self._inline(node).strip(), self.styles.heading(level))

        if level <= CONTENTS_DEPTH:
            # Read by BookDocTemplate.afterFlowable to add a bookmark, an outline entry, and a contents line.
            self._heading_count += 1
            title = " ".join(node.text().split())
            paragraph._toc_key = f"heading-{self._heading_count}"
            paragraph._toc_level = level - 1
            paragraph._toc_title = title
            paragraph._toc_markup = font_safe_markup(title, winansi_has, self.code_font)

        return paragraph

    def _list(self, node: HtmlNode, width: float) -> ListFlowable:
        items = [
            ListItem(self._render_children(item, width - LIST_INDENT, self.styles.list_item))
            for item in node.elements("li")
        ]

        common = {
            "leftIndent": LIST_INDENT,
            "bulletFontName": BODY_FONT,
            "bulletFontSize": self.styles.body.fontSize,
            "spaceAfter": self.styles.body.spaceAfter,
        }

        if node.tag == "ol":
            return ListFlowable(
                items, bulletType="1", start=int(node.attrs.get("start") or 1), bulletFormat="%s.", **common
            )

        return ListFlowable(items, bulletType="bullet", start="\u2022", **common)

    def code_columns(self, width: float) -> int:
        """How many monospace characters fit on one code line at this width, leaving a column spare."""
        usable = width - 2 * CODE_PADDING - 2
        char_width = stringWidth("0", self.code_font.name, CODE_SIZE)

        return max(int(usable / char_width) - 1, 20)

    def _code(self, node: HtmlNode, width: float) -> XPreformatted:
        lines = wrap_code(node.text().rstrip("\n"), self.code_columns(width))
        markup = "\n".join(font_safe_markup(line, self.code_font.has_glyph, self.code_font) for line in lines)

        return XPreformatted(markup, self.styles.code)

    def _table(self, node: HtmlNode, width: float) -> Table:
        rows = node.descendants("tr")
        cells = [row.elements("th", "td") for row in rows]
        plain = [[" ".join(cell.text().split()) for cell in row] for row in cells]
        widths = column_widths(plain, width - 2)
        data = [[self._table_cell(cell) for cell in row] + [""] * (len(widths) - len(row)) for row in cells]
        has_header = bool(cells) and all(cell.tag == "th" for cell in cells[0])
        table = Table(
            data, colWidths=widths, repeatRows=1 if has_header else 0, hAlign="LEFT",
            spaceBefore=4, spaceAfter=10,
        )
        table.setStyle(self._table_style(has_header))

        return table

    def _table_cell(self, cell: HtmlNode) -> Paragraph:
        style = self.styles.table_header if cell.tag == "th" else self.styles.table_cell

        return Paragraph(self._inline(cell).strip(), style)

    @staticmethod
    def _table_style(has_header: bool) -> list[tuple]:
        commands: list[tuple] = [
            ("GRID", (0, 0), (-1, -1), 0.4, RULE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]

        if has_header:
            commands.append(("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BACKGROUND))

        return commands

    # Inline -------------------------------------------------------------------------------------

    def _inline(self, node: HtmlNode | str) -> str:
        """ReportLab paragraph markup for inline content."""
        if isinstance(node, str):
            return font_safe_markup(node, winansi_has, self.code_font)

        inner = "".join(self._inline(child) for child in node.children)

        if node.tag in ("strong", "b"):
            return f"<b>{inner}</b>"

        if node.tag in ("em", "i"):
            return f"<i>{inner}</i>"

        if node.tag == "code":
            code = font_safe_markup(node.text(), self.code_font.has_glyph, self.code_font)
            return f'<font name="{self.code_font.name}" size="{self.styles.body.fontSize - 1}">{code}</font>'

        if node.tag == "br":
            return "<br/>"

        if node.tag == "img":
            return font_safe_markup(node.attrs.get("alt", ""), winansi_has, self.code_font)

        if node.tag == "a":
            return self._link(node.attrs.get("href", ""), inner)

        return inner

    @staticmethod
    def _link(href: str, inner: str) -> str:
        """External links stay clickable; links between book files become plain text in print."""
        if not href.startswith(("http://", "https://", "mailto:")):
            return inner

        return f'<a href="{escape(href, {chr(34): "&quot;"})}" color="{LINK_INK}">{inner}</a>'
