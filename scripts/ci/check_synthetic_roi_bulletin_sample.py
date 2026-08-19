#!/usr/bin/env python3
"""
Merge-blocking guards for the public synthetic aggregate ROI bulletin sample.

1. ``docs/go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md`` first line must be
   the combined Scope + forbidden-publish banner (single line).
2. That file must never contain the real signed-bulletin CHANGELOG heading shape.
"""

from __future__ import annotations

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]

SAMPLE_REL = pathlib.Path("docs/go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md")

EXPECTED_FIRST_LINE = (
    "> **Scope:** Synthetic aggregate ROI bulletin sample. **FORBIDDEN (repository hygiene):** "
    "Do not append this document to `docs/CHANGELOG.md`. Do not add a "
    "`## YYYY-MM-DD — ROI bulletin signed:` section for this synthetic artefact. "
    "Sign-off audit format applies only to real published bulletins "
    "(see `docs/go-to-market/ROI_MODEL.md#aggregate-roi-bulletin-template`; "
    "`AGGREGATE_ROI_BULLETIN_TEMPLATE.md` alias)."
)

SIGNED_BULLETIN_HEADING = re.compile(
    r"^##\s+\d{4}-\d{2}-\d{2}\s+—\s+ROI bulletin signed:",
    re.MULTILINE,
)


def main() -> int:
    sample_path = REPO_ROOT / SAMPLE_REL

    if not sample_path.is_file():
        print(f"error: missing {SAMPLE_REL}", file=sys.stderr)
        return 2

    text = sample_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    if not lines:
        print("error: synthetic sample file is empty", file=sys.stderr)
        return 1

    first = lines[0].strip()

    if first != EXPECTED_FIRST_LINE:
        print(
            "error: SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md first line must match the forbidden-publish banner.\n"
            f"  expected: {EXPECTED_FIRST_LINE!r}\n"
            f"  actual:   {first!r}",
            file=sys.stderr,
        )
        return 1

    if SIGNED_BULLETIN_HEADING.search(text):
        print(
            "error: synthetic sample must not contain a real signed-bulletin CHANGELOG heading "
            "(## YYYY-MM-DD — ROI bulletin signed: …).",
            file=sys.stderr,
        )
        return 1

    print("OK: synthetic ROI bulletin sample guards passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
