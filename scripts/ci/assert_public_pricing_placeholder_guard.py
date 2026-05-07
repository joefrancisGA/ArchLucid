"""
Block buyer-visible accidental surfacing of placeholder Stripe checkout URLs without explicit sales-led acknowledgement.

 Mirrors archlucid-ui/src/lib/team-stripe-checkout-url.ts substring checks plus pricing.json discipline.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

PLACEHOLDER_MARKERS = (
    "placeholder-replace-before-launch",
    "checkout-placeholder",
)


def _looks_placeholder(url: str) -> bool:
    u = url.strip().lower()
    return any(m in u for m in PLACEHOLDER_MARKERS)


def main() -> int:
    pricing_path = REPO_ROOT / "archlucid-ui/public/pricing.json"
    raw = pricing_path.read_text(encoding="utf-8")
    data = json.loads(raw)

    url = ""
    candidate = data.get("teamStripeCheckoutUrl")
    if isinstance(candidate, str):
        url = candidate

    if url and _looks_placeholder(url):
        flag = data.get("teamStripeCheckoutUrlSalesLedPlaceholder")
        if flag is not True:
            print(
                "ERROR: teamStripeCheckoutUrl is a documented placeholder substring but "
                "teamStripeCheckoutUrlSalesLedPlaceholder is not true. "
                "UI hides Subscribe-with-Stripe unless env enables it — JSON must record explicit sales-led intent.",
                file=sys.stderr,
            )
            return 1

    print("assert_public_pricing_placeholder_guard: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
