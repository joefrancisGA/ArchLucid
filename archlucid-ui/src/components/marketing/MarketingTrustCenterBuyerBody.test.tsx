import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingTrustCenterBuyerBody } from "./MarketingTrustCenterBuyerBody";

describe("MarketingTrustCenterBuyerBody", () => {
  it("groups primary diligence CTAs near the header", () => {
    render(<MarketingTrustCenterBuyerBody lastReviewedUtc="2026-05-01T00:00:00.000Z" />);

    const ctaRow = screen.getByTestId("trust-center-primary-ctas");
    expect(within(ctaRow).getByRole("link", { name: /Request diligence materials/i })).toHaveAttribute(
      "href",
      "mailto:security@archlucid.net",
    );
    expect(within(ctaRow).getByRole("link", { name: /Security and trust detail/i })).toHaveAttribute(
      "href",
      "/security-trust",
    );
    expect(within(ctaRow).getByRole("link", { name: /Security review contact/i })).toHaveAttribute(
      "href",
      "#trust-contact-review",
    );
  });
});
