"""
Block buyer-visible accidental surfacing of placeholder Stripe checkout URLs without explicit sales-led acknowledgement.

Mirrors archlucid-ui/src/lib/team-stripe-checkout-url.ts substring checks plus pricing.json discipline
(`scripts/ci/pricing_json_checkout_guard.py`).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

import pricing_json_checkout_guard as checkout_guard  # noqa: E402


REPO_ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    pricing_path = REPO_ROOT / "archlucid-ui/public/pricing.json"
    raw = pricing_path.read_text(encoding="utf-8")
    data = json.loads(raw)

    checkout_err = checkout_guard.validate_pricing_json_team_checkout(data)

    if checkout_err is not None:
        print(f"ERROR: {checkout_err}", file=sys.stderr)

        return 1

    print("assert_public_pricing_placeholder_guard: OK")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
