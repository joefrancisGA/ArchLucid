import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingEvidenceOrientationStrip } from "@/components/marketing/PricingEvidenceOrientationStrip";
import { PRICING_CANONICAL_PATH, PRICING_SOURCES } from "@/lib/pricing-evidence-copy";

describe("PricingEvidenceOrientationStrip", () => {
  it("lists evaluation Sources without self-linking pricing", () => {
    render(<PricingEvidenceOrientationStrip />);

    expect(screen.getByTestId("pricing-sources")).toBeInTheDocument();
    expect(screen.getByTestId("pricing-claim-discipline")).toHaveTextContent(
      /Commercial packaging|CPA SOC 2|third-party pen/i,
    );

    const sources = screen.getByTestId("pricing-sources");

    for (const link of PRICING_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PRICING_SOURCES.some((link) => link.href === PRICING_CANONICAL_PATH)).toBe(false);
  });
});
