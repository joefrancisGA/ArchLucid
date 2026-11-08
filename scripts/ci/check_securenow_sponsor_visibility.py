#!/usr/bin/env python3
"""Warn when SecureNow sponsor-visibility materials drift into customer claims."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

READOUT = Path("docs/securenow/SPONSOR_READOUT_OUTLINE.md")
SCORECARD = Path("docs/securenow/SPONSOR_OUTCOME_SCORECARD_FIXTURE.md")
FILL_GUIDE = Path("docs/securenow/EXECUTIVE_PACKET_FILL_GUIDE.md")
PACK_INDEX = Path("docs/securenow/PROCUREMENT_PACK_INDEX.md")
SPONSOR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts")

FORBIDDEN = (
    "guaranteed savings",
    "guaranteed roi",
    "soc 2 certified",
    "third-party penetration-test completion",
)


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    readout = _read(root, READOUT, errors)
    scorecard = _read(root, SCORECARD, errors)
    fill_guide = _read(root, FILL_GUIDE, errors)
    pack_index = _read(root, PACK_INDEX, errors)
    sponsor_copy = _read(root, SPONSOR_COPY, errors)

    if readout:
        for token in ("30–45 minute", "Sponsor question", "NOT VERIFIED", "FIXTURE", "NO_GO"):
            if token not in readout:
                errors.append(f"{READOUT}: missing {token!r}")
    if scorecard:
        for token in ("FIXTURE ONLY", "NOT VERIFIED", "does not calculate ROI"):
            if token not in scorecard:
                errors.append(f"{SCORECARD}: missing {token!r}")
    if fill_guide:
        for token in ("NOT COLLECTED", "NOT VERIFIED", "external human attestation", "Explicit exclusions"):
            if token not in fill_guide:
                errors.append(f"{FILL_GUIDE}: missing {token!r}")
    if pack_index:
        for token in ("EXECUTIVE_PACKET_FILL_GUIDE.md", "SPONSOR_READOUT_OUTLINE.md", "SPONSOR_OUTCOME_SCORECARD_FIXTURE.md"):
            if token not in pack_index:
                errors.append(f"{PACK_INDEX}: missing {token!r}")
    if sponsor_copy:
        for token in ("For sponsors", "NO_GO", "/why-securenow#reviewer-pack"):
            if token not in sponsor_copy:
                errors.append(f"{SPONSOR_COPY}: missing {token!r}")

    for relative, text in (
        (READOUT, readout),
        (SCORECARD, scorecard),
        (FILL_GUIDE, fill_guide),
        (SPONSOR_COPY, sponsor_copy),
    ):
        lowered = text.lower()
        for phrase in FORBIDDEN:
            if phrase in lowered:
                errors.append(f"{relative}: contains forbidden phrase {phrase!r}")
        if "$" in text:
            errors.append(f"{relative}: contains '$'")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow sponsor visibility: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
