import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  SECURENOW_COMPLIANCE_HOME_SECTION_HEADING,
} from "@/lib/product-line/securenow-compliance-home-copy";
import { InfrastructureOverviewClient } from "./InfrastructureOverviewClient";

describe("InfrastructureOverviewClient SecureNow compliance section", () => {
  it("renders ARC-AMPE compliance posture destinations on the Security home", () => {
    render(<InfrastructureOverviewClient />);

    expect(screen.getByTestId("securenow-compliance-home-section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURENOW_COMPLIANCE_HOME_SECTION_HEADING })).toBeInTheDocument();
    expect(screen.getAllByText(/ARC-AMPE architecture themes/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId(`securenow-compliance-home-link-${GOVERNANCE_POLICY_PACKS_PATH}`)).toHaveAttribute(
      "href",
      GOVERNANCE_POLICY_PACKS_PATH,
    );
  });
});
