import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingEvidenceOrientationStrip } from "@/components/marketing/PricingEvidenceOrientationStrip";
import { PRICING_CANONICAL_PATH, PRICING_SOURCES } from "@/lib/pricing-evidence-copy";

describe("PricingEvidenceOrientationStrip", () => {
  it("lists evaluation Sources without self-linking pricing", () => {
    render(<PricingEvidenceOrientationStrip />);

    expect(screen.getByTestId("pricing-sources")).toBeInTheDocument();

    const sources = screen.getByTestId("pricing-sources");

    for (const link of PRICING_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PRICING_SOURCES.some((link) => link.href === PRICING_CANONICAL_PATH)).toBe(false);
  });

  it("carries no claim-discipline band", () => {
    render(<PricingEvidenceOrientationStrip />);

    // Tier cards make no assurance claim, so a caution band would hedge a claim the page never makes.
    expect(screen.queryByTestId("pricing-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByText(/commercial packaging only/i)).not.toBeInTheDocument();
  });
});
