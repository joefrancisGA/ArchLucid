import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BillingAndPlansHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/BillingAndPlansHelpEvidenceOrientationStrip";
import {
  BILLING_AND_PLANS_HELP_CANONICAL_PATH,
  BILLING_AND_PLANS_HELP_SOURCES,
} from "@/lib/billing-and-plans-help-evidence-copy";

describe("BillingAndPlansHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking billing help", () => {
    render(<BillingAndPlansHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("billing-and-plans-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("billing-and-plans-help-claim-discipline")).toBeInTheDocument();

    for (const link of BILLING_AND_PLANS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      BILLING_AND_PLANS_HELP_SOURCES.some((link) => link.href === BILLING_AND_PLANS_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
