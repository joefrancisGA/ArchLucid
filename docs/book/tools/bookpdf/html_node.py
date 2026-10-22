"""A minimal element tree for the HTML that ``markdown`` produces."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class HtmlNode:
    """One element. ``children`` mixes child elements and text strings in document order."""

    tag: str
    attrs: dict[str, str] = field(default_factory=dict)
    children: list[HtmlNode | str] = field(default_factory=list)

    def elements(self, *tags: str) -> list[HtmlNode]:
        """Direct child elements, optionally only those with one of ``tags``."""
        return [child for child in self.children if isinstance(child, HtmlNode) and (not tags or child.tag in tags)]

    def descendants(self, tag: str) -> list[HtmlNode]:
        """Every element below this one with ``tag``, in document order."""
        found: list[HtmlNode] = []

        for child in self.elements():
            if child.tag == tag:
                found.append(child)

            found.extend(child.descendants(tag))

        return found

    def text(self) -> str:
        """All text below this element, without markup."""
        return "".join(child if isinstance(child, str) else child.text() for child in self.children)
