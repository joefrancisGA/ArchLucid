#!/usr/bin/env python3
"""Retired assessment generator.

The former implementation embedded a May 2026 quality model and product-state
assumptions directly in code. Running it could overwrite assessment output with
claims that no longer describe the current repository.

Current assessment work is intentionally driven from the repository's canonical
assessment inputs and rolling assessment workflow instead of this historical
one-off generator.
"""

from __future__ import annotations

import sys


def main() -> int:
    message = (
        "generate_assessment.py is retired because its embedded product assumptions "
        "are stale. Use docs/library/ASSESSMENT_INPUTS.md and the rolling "
        "docs/assessments/LATEST_GPT55.md workflow (see "
        ".cursor/commands/ship-next-improvement.md) instead."
    )
    print(message, file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
