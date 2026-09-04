import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";

import { OperatorBillingSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  OPERATOR_BILLING_SETTINGS_CANONICAL_PATH,
  OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE,
  OPERATOR_BILLING_SETTINGS_SOURCES,
  OPERATOR_BILLING_SETTINGS_SOURCES_INTRO,
} from "@/lib/operator/operator-billing-settings-evidence-copy";

describe("operator-billing-settings-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(OPERATOR_BILLING_SETTINGS_CANONICAL_PATH).toBe("/administration/billing");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<OperatorBillingSettingsEvidenceOrientationStrip />);

    expect(screen.queryByTestId("operator-billing-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(OPERATOR_BILLING_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("operator-billing-settings-sources");

    for (const link of filterWhereToGoNextFollowUpLinks(OPERATOR_BILLING_SETTINGS_SOURCES)) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${OPERATOR_BILLING_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<OperatorBillingSettingsEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
