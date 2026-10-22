"""Font choice and per-character fallback.

The body uses ReportLab's built-in Times family and code uses Courier, unless a monospace TrueType
font with box-drawing glyphs is installed; then code uses that. Built-in fonts only cover the
Windows-1252 character set, so any other character falls back to the standard Symbol font, then to
the code font, then to an ASCII stand-in. Nothing is silently dropped.
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.rl_codecs import RL_Codecs
from reportlab.pdfbase.ttfonts import TTFError, TTFont

BODY_FONT = "Times-Roman"
HEADING_FONT = "Helvetica-Bold"
BUILTIN_CODE_FONT = "Courier"
TTF_CODE_FONT = "BookMono"
SYMBOL_FONT = "Symbol"

# Free or OS-bundled monospace fonts. ReportLab refuses a font whose license flags forbid embedding.
MONO_CANDIDATES = (
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/dejavu/DejaVuSansMono.ttf",
    "/Library/Fonts/DejaVuSansMono.ttf",
    r"C:\Windows\Fonts\consola.ttf",
)

# Same-width stand-ins tried before falling back to another font.
GLYPH_SUBSTITUTES = {"\u25b6": "\u25ba"}

# Last resort, so a missing glyph never prints as an empty box.
ASCII_FALLBACK = {
    "\u2500": "-", "\u2502": "|", "\u250c": "+", "\u2510": "+", "\u2514": "+", "\u2518": "+",
    "\u251c": "+", "\u2524": "+", "\u252c": "+", "\u2534": "+", "\u253c": "+",
    "\u2190": "<", "\u2192": ">", "\u2191": "^", "\u2193": "v",
    "\u25b6": ">", "\u25ba": ">", "\u25bc": "v", "\u21b5": "\\",
}

RL_Codecs.register()


def winansi_has(char: str) -> bool:
    """Built-in PDF fonts (Times, Helvetica, Courier) encode text as Windows-1252."""
    try:
        char.encode("cp1252")
    except UnicodeEncodeError:
        return False

    return True


def symbol_has(char: str) -> bool:
    """True if the standard Symbol font has a glyph for ``char``."""
    try:
        char.encode("symbol")
    except UnicodeEncodeError:
        return False

    return True


def _ttf_has(font: TTFont) -> Callable[[str], bool]:
    return lambda char: ord(char) in font.face.charToGlyph


class CodeFont:
    """The font used for code and inline code, and a test for which characters it can draw."""

    def __init__(self, name: str, has_glyph: Callable[[str], bool]) -> None:
        if not name:
            raise ValueError("name is required")

        if has_glyph is None:
            raise ValueError("has_glyph is required")

        self.name = name
        self.has_glyph = has_glyph


def register_code_font(candidates: tuple[str, ...] = MONO_CANDIDATES) -> CodeFont:
    """Register the first usable TrueType candidate as the code font, or fall back to Courier."""
    for candidate in candidates:
        if not Path(candidate).is_file():
            continue

        try:
            font = TTFont(TTF_CODE_FONT, candidate)
        except TTFError:
            continue

        pdfmetrics.registerFont(font)
        # <b> and <i> inside inline code need a family mapping; the regular face serves for all four.
        pdfmetrics.registerFontFamily(
            TTF_CODE_FONT, normal=TTF_CODE_FONT, bold=TTF_CODE_FONT, italic=TTF_CODE_FONT, boldItalic=TTF_CODE_FONT
        )

        return CodeFont(TTF_CODE_FONT, _ttf_has(font))

    return CodeFont(BUILTIN_CODE_FONT, winansi_has)


def _segment(char: str, base_has: Callable[[str], bool], code_font: CodeFont) -> tuple[str | None, str]:
    """(font override or None, character to draw) for one character."""
    if base_has(char):
        return None, char

    substitute = GLYPH_SUBSTITUTES.get(char)

    if substitute is not None and base_has(substitute):
        return None, substitute

    if symbol_has(char):
        return SYMBOL_FONT, char

    if code_font.has_glyph(char):
        return code_font.name, char

    return None, ASCII_FALLBACK.get(char, "?")


def font_safe_markup(text: str, base_has: Callable[[str], bool], code_font: CodeFont) -> str:
    """XML-escape ``text`` for a ReportLab paragraph, wrapping characters the base font lacks in a fallback font."""
    if not text:
        return ""

    runs: list[tuple[str | None, list[str]]] = []

    for char in text:
        font, drawn = _segment(char, base_has, code_font)

        if runs and runs[-1][0] == font:
            runs[-1][1].append(drawn)
        else:
            runs.append((font, [drawn]))

    return "".join(_run_markup(font, chars) for font, chars in runs)


def _run_markup(font: str | None, chars: list[str]) -> str:
    body = escape("".join(chars))

    return body if font is None else f'<font name="{font}">{body}</font>'
