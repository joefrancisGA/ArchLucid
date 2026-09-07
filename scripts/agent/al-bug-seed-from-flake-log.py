#!/usr/bin/env python3
"""Preview (candidate) rows from the flake log. Does not write the hunt ledger."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_escape_log import parse_iso_utc  # noqa: E402
from al_bug_flake_log import DEFAULT_FLAKE_LOG_PATH, read_flake_log, seed_candidates  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--flake-log", type=Path, default=DEFAULT_FLAKE_LOG_PATH)
    parser.add_argument("--at-utc")
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args(argv)

    if args.at_utc:
        now = parse_iso_utc(args.at_utc)
    else:
        now = datetime.now(timezone.utc)

    entries = read_flake_log(args.flake_log)
    candidates = seed_candidates(entries, now)
    if args.preview:
        print("## Flake seed preview")
        print()
        print("Paste as **(candidate)** only. Flakes are not hunt-ready. Cheap-disproof: slow ≠ racy.")
        print()
        for line in candidates:
            print(f"- [ ] {line}")
    print(json.dumps({"preview": bool(args.preview), "candidates": candidates}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
