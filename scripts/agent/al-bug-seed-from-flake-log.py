#!/usr/bin/env python3
"""Preview (candidate) rows from the flake log. Does not write the hunt ledger."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_escape_log import parse_iso_utc  # noqa: E402
from al_bug_flake_log import (  # noqa: E402
    DEFAULT_FLAKE_LOG_PATH,
    preview_trx_candidates,
    read_flake_log,
    seed_candidates,
)
from al_bug_ledger import DEFAULT_LEDGER_PATH  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--flake-log", type=Path, default=DEFAULT_FLAKE_LOG_PATH)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER_PATH)
    parser.add_argument("--trx", type=Path, help="VSTest TRX with fail-then-pass rows (preview only).")
    parser.add_argument("--apply", action="store_true", help="Append preview TRX lines to the flake log.")
    parser.add_argument("--at-utc")
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args(argv)

    if args.at_utc:
        now = parse_iso_utc(args.at_utc)
    else:
        now = datetime.now(timezone.utc)

    if args.trx is not None:
        ledger_text = args.ledger.read_text(encoding="utf-8")
        trx_lines = preview_trx_candidates(args.trx, ledger_text, now)
        if args.preview or not args.apply:
            for payload in trx_lines:
                print(json.dumps(payload, separators=(",", ":")))
            return 0
        if args.apply:
            args.flake_log.parent.mkdir(parents=True, exist_ok=True)
            with args.flake_log.open("a", encoding="utf-8") as handle:
                for payload in trx_lines:
                    handle.write(json.dumps(payload, separators=(",", ":")) + "\n")
            return 0

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
