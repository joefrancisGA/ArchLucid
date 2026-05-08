#!/usr/bin/env python3
"""Guardrail: golden-cohort nightly keeps honest job ids (preflight vs live)."""

from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    path = root / ".github" / "workflows" / "golden-cohort-nightly.yml"
    text = path.read_text(encoding="utf-8")

    if "cohort-real-llm-gate:" in text:
        print(
            "::error::golden-cohort-nightly.yml regressed job id cohort-real-llm-gate; "
            "rename back to cohort-real-llm-preflight or split naming deliberately."
        )
        return 1

    if "cohort-real-llm-preflight:" not in text:
        print("::error::golden-cohort-nightly.yml missing cohort-real-llm-preflight job")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
