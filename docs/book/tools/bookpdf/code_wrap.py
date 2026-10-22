"""Wrap code lines to a fixed column so nothing is clipped at the frame edge."""

from __future__ import annotations

# Carriage-return arrow. The standard PDF Symbol font has this glyph, so every reader can draw it.
CONTINUATION_MARKER = "\u21b5"
CONTINUATION_INDENT = "    "
TAB_SIZE = 4


def _leading_whitespace(line: str) -> str:
    return line[: len(line) - len(line.lstrip(" "))]


def _continuation_prefix(line: str, width: int) -> str:
    """Continuations sit one indent deeper than the line they continue, unless that eats half the width."""
    prefix = _leading_whitespace(line) + CONTINUATION_INDENT

    return prefix if len(prefix) <= width // 2 else CONTINUATION_INDENT


def _break_index(text: str, room: int) -> int:
    """Where to cut ``text`` so the first piece fits in ``room`` characters.

    Prefer the last space in the second half of the room, so words stay whole; otherwise cut hard.
    """
    space = text.rfind(" ", room // 2, room)

    return space + 1 if space > 0 else room


def wrap_code_line(line: str, width: int) -> list[str]:
    """Split one code line into pieces no wider than ``width``.

    Every piece except the last ends with the continuation marker, and every piece after the first
    starts with the continuation indent, so a reader can see where the source line was broken.
    """
    if width < 8:
        raise ValueError("width must be at least 8 columns")

    expanded = (line or "").expandtabs(TAB_SIZE).rstrip()

    if len(expanded) <= width:
        return [expanded]

    prefix = _continuation_prefix(expanded, width)
    pieces: list[str] = []
    remaining = expanded
    lead = ""

    while len(lead) + len(remaining) > width:
        room = width - len(lead) - len(CONTINUATION_MARKER)
        cut = _break_index(remaining, room)
        pieces.append(lead + remaining[:cut] + CONTINUATION_MARKER)
        remaining = remaining[cut:].lstrip(" ")
        lead = prefix

    pieces.append(lead + remaining)

    return pieces


def wrap_code(text: str, width: int) -> list[str]:
    """Wrap every line of a code block; blank lines are kept."""
    return [piece for line in (text or "").splitlines() for piece in wrap_code_line(line, width)]
