"""Unit tests for `pricing_json_checkout_guard` (public pricing checkout / placeholder invariants)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent.parent
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

import pricing_json_checkout_guard as g  # noqa: E402


class TestPricingJsonCheckoutGuard(unittest.TestCase):
    def test_placeholder_without_sales_led_flag_fails(self):
        err = g.validate_pricing_json_team_checkout(
            {"teamStripeCheckoutUrl": "https://checkout.stripe.com/placeholder-replace-before-launch"},
        )

        self.assertIsNotNone(err)

    def test_placeholder_with_sales_led_hidden_cta_allowance_ok(self):
        err = g.validate_pricing_json_team_checkout(
            {
                "teamStripeCheckoutUrl": "https://checkout.stripe.com/placeholder-replace-before-launch",
                "teamStripeCheckoutUrlSalesLedPlaceholder": True,
            },
        )

        self.assertIsNone(err)

    def test_checkout_placeholder_marker_requires_flag(self):
        err = g.validate_pricing_json_team_checkout(
            {"teamStripeCheckoutUrl": "https://v.example/checkout-placeholder/1"},
        )

        self.assertIsNotNone(err)

    def test_cs_test_requires_explicit_test_mode_flag(self):
        err = g.validate_pricing_json_team_checkout(
            {"teamStripeCheckoutUrl": "https://checkout.stripe.com/c/pay/cs_test_abc"},
        )

        self.assertIsNotNone(err)

        ok = g.validate_pricing_json_team_checkout(
            {
                "teamStripeCheckoutUrl": "https://checkout.stripe.com/c/pay/cs_test_abc",
                "teamStripeCheckoutUrlStripeTestMode": True,
            },
        )

        self.assertIsNone(ok)

    def test_buy_stripe_test_payment_link_requires_flag(self):
        err = g.validate_pricing_json_team_checkout(
            {"teamStripeCheckoutUrl": "https://buy.stripe.com/test_a1b2/..."},
        )

        self.assertIsNotNone(err)

    def test_cs_live_must_not_claim_test_mode(self):
        err = g.validate_pricing_json_team_checkout(
            {
                "teamStripeCheckoutUrl": "https://checkout.stripe.com/c/pay/cs_live_xyz",
                "teamStripeCheckoutUrlStripeTestMode": True,
            },
        )

        self.assertIsNotNone(err)

    def test_live_buy_stripe_must_not_claim_test_mode(self):
        err = g.validate_pricing_json_team_checkout(
            {
                "teamStripeCheckoutUrl": "https://buy.stripe.com/fZe9CV5xV3cs2zC0GG",
                "teamStripeCheckoutUrlStripeTestMode": True,
            },
        )

        self.assertIsNotNone(err)

    def test_omitted_url_ok(self):
        self.assertIsNone(g.validate_pricing_json_team_checkout({}))

        self.assertIsNone(
            g.validate_pricing_json_team_checkout({"teamStripeCheckoutUrl": ""}),
        )


if __name__ == "__main__":
    unittest.main()
