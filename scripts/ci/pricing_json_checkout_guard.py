"""
Shared validation for `archlucid-ui/public/pricing.json` Team checkout fields.

Keep substring markers aligned with `archlucid-ui/src/lib/team-stripe-checkout-url.ts`.
"""

from __future__ import annotations

PLACEHOLDER_MARKERS = (
    "placeholder-replace-before-launch",
    "checkout-placeholder",
)


def looks_placeholder_stripe_checkout_url(url: str) -> bool:
    u = url.strip().lower()
    return any(m in u for m in PLACEHOLDER_MARKERS)


def looks_stripe_hosted_test_checkout(url: str) -> bool:
    """
    Stripe Checkout sessions in test mode use `cs_test_*`; Payment Links in test mode use a
    `buy.stripe.com/test_*` path prefix (first segment after the hostname).
    """

    lower = url.strip().lower()

    if "cs_test_" in lower:
        return True

    host_key = "buy.stripe.com/"
    if host_key not in lower:
        return False

    idx = lower.find(host_key)
    tail = lower[idx + len(host_key) :]
    first_seg = tail.split("/")[0].split("?")[0]

    return first_seg.startswith("test_")


def looks_stripe_hosted_live_checkout(url: str) -> bool:
    """`cs_live_*` hosted Checkout, or a live-mode Payment Link on `buy.stripe.com` (non-test segment)."""

    lower = url.strip().lower()

    if "cs_live_" in lower:
        return True

    host_key = "buy.stripe.com/"
    if host_key not in lower:
        return False

    idx = lower.find(host_key)
    tail = lower[idx + len(host_key) :]
    first_seg = tail.split("/")[0].split("?")[0]

    if len(first_seg) == 0:
        return False

    return not first_seg.startswith("test_")


def validate_pricing_json_team_checkout(data: dict) -> str | None:
    """
    Returns an error message, or None when OK.
    Caller ensures `data` is the decoded pricing.json root object.
    """

    candidate = data.get("teamStripeCheckoutUrl")
    if not isinstance(candidate, str):
        return None

    url = candidate.strip()

    if len(url) == 0:
        return None

    if looks_placeholder_stripe_checkout_url(url):
        if data.get("teamStripeCheckoutUrlSalesLedPlaceholder") is not True:
            return (
                "teamStripeCheckoutUrl is a placeholder substring but "
                "teamStripeCheckoutUrlSalesLedPlaceholder is not true — see "
                "docs/go-to-market/PRICING_PHILOSOPHY.md §5.2."
            )

        return None

    test_labeled = data.get("teamStripeCheckoutUrlStripeTestMode") is True

    if looks_stripe_hosted_test_checkout(url) and not test_labeled:
        return (
            "teamStripeCheckoutUrl matches a Stripe test-mode hosted Checkout / Payment Link pattern "
            "(cs_test_* or buy.stripe.com/test_*) but teamStripeCheckoutUrlStripeTestMode is not true — "
            "label test-only URLs explicitly (see PRICING_PHILOSOPHY.md §5.2)."
        )

    if test_labeled and looks_stripe_hosted_live_checkout(url):
        return (
            "teamStripeCheckoutUrlStripeTestMode must not be true for live-mode Stripe checkout URLs "
            "(cs_live_* or non-test buy.stripe.com links)."
        )

    return None
