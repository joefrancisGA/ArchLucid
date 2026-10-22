"""Marker lines Evergreen puts in PR bodies, comments and issues so later runs can recognise earlier work."""

from __future__ import annotations

import re

FINGERPRINT_MARKER = "Evergreen-Fingerprint:"
# Coarser than the fingerprint: workflow + branch + failed job names, ignoring the error text.
FAMILY_MARKER = "Evergreen-Family:"


def carries(text: str | None, marker: str, value: str) -> bool:
    """True when ``text`` has ``<marker> <value>`` with ``value`` as a whole word.

    The word boundary keeps a longer id that merely starts with ours from matching.
    """
    pattern = re.compile(rf"{re.escape(marker)}\s*{re.escape(value)}\b")
    return bool(pattern.search(text or ""))


def render(fingerprint: str, family: str) -> str:
    return f"{FINGERPRINT_MARKER} {fingerprint}\n{FAMILY_MARKER} {family}"
