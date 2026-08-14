import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorBillingSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  OPERATOR_BILLING_SETTINGS_CANONICAL_PATH,
  OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE,
  OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  OPERATOR_BILLING_SETTINGS_CLAIM_HEADING_ID,
  OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE,
  OPERATOR_BILLING_SETTINGS_SOURCES,
  OPERATOR_BILLING_SETTINGS_SOURCES_INTRO,
} from "@/lib/operator/operator-billing-settings-evidence-copy";

describe("operator-billing-settings-evidence-copy", () => {
  it("wires exports into the Billing settings evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("operator-billing-settings-evidence-copy");
    expect(registrySource).toContain("OperatorBillingSettingsEvidenceOrientationStrip");
    expect(OPERATOR_BILLING_SETTINGS_CANONICAL_PATH).toBe("/administration/billing");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<OperatorBillingSettingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("operator-billing-settings-claim-discipline")).toHaveTextContent(
      OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(OPERATOR_BILLING_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("operator-billing-settings-sources");

    for (const link of OPERATOR_BILLING_SETTINGS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${OPERATOR_BILLING_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<OperatorBillingSettingsEvidenceOrientationStrip />);

    const claim = screen.getByTestId("operator-billing-settings-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", OPERATOR_BILLING_SETTINGS_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
