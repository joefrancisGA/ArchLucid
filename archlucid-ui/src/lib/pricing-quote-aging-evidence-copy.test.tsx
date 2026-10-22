import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { PricingQuoteAgingEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  PRICING_QUOTE_AGING_CANONICAL_PATH,
  PRICING_QUOTE_AGING_FOLLOW_UPS_TITLE,
  PRICING_QUOTE_AGING_SOURCES,
  PRICING_QUOTE_AGING_SOURCES_INTRO,
} from "@/lib/pricing-quote-aging-evidence-copy";

describe("pricing-quote-aging-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(PRICING_QUOTE_AGING_CANONICAL_PATH).toBe("/internal/pricing-quote-aging");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<PricingQuoteAgingEvidenceOrientationStrip />);

    expect(screen.queryByTestId("pricing-quote-aging-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(PRICING_QUOTE_AGING_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("pricing-quote-aging-sources");

    for (const link of PRICING_QUOTE_AGING_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${PRICING_QUOTE_AGING_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<PricingQuoteAgingEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: PRICING_QUOTE_AGING_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
