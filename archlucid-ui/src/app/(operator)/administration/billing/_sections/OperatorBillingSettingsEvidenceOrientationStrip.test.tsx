import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorBillingSettingsEvidenceOrientationStrip } from "@/app/(operator)/administration/billing/_sections/OperatorBillingSettingsEvidenceOrientationStrip";
import {
  OPERATOR_BILLING_SETTINGS_CANONICAL_PATH,
  OPERATOR_BILLING_SETTINGS_SOURCES,
} from "@/lib/operator-billing-settings-evidence-copy";

describe("OperatorBillingSettingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking billing settings", () => {
    render(<OperatorBillingSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("operator-billing-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("operator-billing-settings-claim-discipline")).toBeInTheDocument();

    for (const link of OPERATOR_BILLING_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      OPERATOR_BILLING_SETTINGS_SOURCES.some(
        (link) => link.href === OPERATOR_BILLING_SETTINGS_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
