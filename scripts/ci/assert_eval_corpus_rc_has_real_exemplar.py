#!/usr/bin/env python3
"""Fail when no committed *.real.json exists under tests/eval-corpus/agent-results (RC gate)."""

from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    folder = root / "tests" / "eval-corpus" / "agent-results"
    if not folder.is_dir():
        print(f"::error::Missing directory {folder}")
        return 1

    real_files = sorted(folder.glob("*.real.json"))
    if not real_files:
        print(
            "::error::No tests/eval-corpus/agent-results/*.real.json found. "
            "Capture a Web AgentResult JSON (see docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) "
            "or point ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT at an exported file for local RC runs."
        )
        return 1

    print(f"Eval corpus RC: found {len(real_files)} committed real exemplar(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
