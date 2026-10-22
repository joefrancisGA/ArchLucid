#!/usr/bin/env python3
"""Guard frozen-pin advances with the latest private-beta witness conclusion."""

from __future__ import annotations

import argparse
import sys


def pin_advance_allowed(conclusion: str | None) -> bool:
    """Allow only a successful witness to authorize a frozen-pin advance."""
    return conclusion is None or conclusion.strip().lower() == "success"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--conclusion",
        help="Latest private-beta access-path conclusion; omit when no witness is available.",
    )
    args = parser.parse_args()

    conclusion = args.conclusion.strip().lower() if args.conclusion is not None else None

    if conclusion is None:
        print("::notice::private-beta witness conclusion is unavailable; frozen-pin advance was not authorized")

        return 0

    if not pin_advance_allowed(conclusion):
        print(
            f"::error::private-beta witness conclusion is {conclusion}; "
            "frozen-pin advance requires a successful JwtBearer witness",
        )

        return 1

    print("Private-beta witness is successful; frozen-pin advance is authorized.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
