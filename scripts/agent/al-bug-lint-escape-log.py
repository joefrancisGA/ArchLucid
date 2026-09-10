#!/usr/bin/env python3
"""Validate AL_BUG_ESCAPE_LOG.jsonl zone ids against the hunt ledger."""

from __future__ import annotations

import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_escape_log import DEFAULT_ESCAPE_LOG_PATH, validate_escape_log  # noqa: E402
from al_bug_ledger import DEFAULT_LEDGER_PATH  # noqa: E402


def main() -> int:
    ledger_text = DEFAULT_LEDGER_PATH.read_text(encoding="utf-8")
    errors = validate_escape_log(DEFAULT_ESCAPE_LOG_PATH, ledger_text)

    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        return 1

    print(f"OK: {DEFAULT_ESCAPE_LOG_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
