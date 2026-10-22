"""Parse ``markdown``'s HTML output into an :class:`HtmlNode` tree."""

from __future__ import annotations

from html.parser import HTMLParser

from bookpdf.html_node import HtmlNode

VOID_TAGS = frozenset({"br", "hr", "img"})


class HtmlTreeBuilder(HTMLParser):
    """Builds a tree; ``markdown`` emits well-formed HTML, so no recovery from bad nesting is needed."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = HtmlNode("root")
        self._stack: list[HtmlNode] = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = HtmlNode(tag, {name: value or "" for name, value in attrs})
        self._stack[-1].children.append(node)

        if tag not in VOID_TAGS:
            self._stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._stack[-1].children.append(HtmlNode(tag, {name: value or "" for name, value in attrs}))

    def handle_endtag(self, tag: str) -> None:
        if tag in VOID_TAGS:
            return

        # Pop to the matching open element; tolerate a stray end tag by ignoring it.
        for depth in range(len(self._stack) - 1, 0, -1):
            if self._stack[depth].tag == tag:
                del self._stack[depth:]
                return

    def handle_data(self, data: str) -> None:
        self._stack[-1].children.append(data)


def parse_html(html: str) -> HtmlNode:
    """Tree for an HTML fragment."""
    builder = HtmlTreeBuilder()
    builder.feed(html or "")
    builder.close()

    return builder.root
