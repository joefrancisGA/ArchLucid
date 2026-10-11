"""Page layout, footer, bookmarks, and contents entries."""

from __future__ import annotations

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import BaseDocTemplate, Flowable, Frame, PageTemplate

from bookpdf.fonts import BODY_FONT
from bookpdf.styles import MUTED_INK

PAGE_SIZE = letter
SIDE_MARGIN = 0.9 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.85 * inch
FOOTER_BASELINE = 0.5 * inch


class BookDocTemplate(BaseDocTemplate):
    """One-frame pages with a footer. Headings marked by the renderer become bookmarks and contents lines."""

    def __init__(self, filename: str, short_title: str, **kwargs: object) -> None:
        super().__init__(
            filename,
            pagesize=PAGE_SIZE,
            leftMargin=SIDE_MARGIN,
            rightMargin=SIDE_MARGIN,
            topMargin=TOP_MARGIN,
            bottomMargin=BOTTOM_MARGIN,
            **kwargs,
        )
        self.short_title = short_title or ""
        self._last_outline_level = -1
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates([PageTemplate(id="book", frames=[frame], onPage=self._draw_footer)])

    def beforeDocument(self) -> None:
        # multiBuild lays the document out several times; every pass starts a fresh outline.
        self._last_outline_level = -1

    def afterFlowable(self, flowable: Flowable) -> None:
        key = getattr(flowable, "_toc_key", None)

        if key is None:
            return

        # PDF outlines can't skip a level, so a section before its first chapter heading is promoted.
        level = min(flowable._toc_level, self._last_outline_level + 1)
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(flowable._toc_title, key, level=level, closed=level == 0)
        self._last_outline_level = level
        self.notify("TOCEntry", (flowable._toc_level, flowable._toc_markup, self.page, key))

    def _draw_footer(self, canvas, doc) -> None:
        if doc.page == 1:
            return

        canvas.saveState()
        canvas.setFont(BODY_FONT, 8.5)
        canvas.setFillColor(MUTED_INK)
        canvas.drawString(doc.leftMargin, FOOTER_BASELINE, self.short_title)
        canvas.drawRightString(PAGE_SIZE[0] - doc.rightMargin, FOOTER_BASELINE, str(doc.page))
        canvas.restoreState()
