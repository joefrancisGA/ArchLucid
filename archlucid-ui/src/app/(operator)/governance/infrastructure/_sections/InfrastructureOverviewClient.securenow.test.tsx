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
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SECURENOW_COMPLIANCE_HOME_SECTION_HEADING } from "@/lib/product-line/securenow-compliance-home-copy";
import { SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING } from "@/lib/product-line/securenow-infrastructure-home-copy";
import { SECURENOW_SECURITY_HOME_SECTION_HEADING } from "@/lib/product-line/securenow-security-home-copy";
import { InfrastructureOverviewClient } from "./InfrastructureOverviewClient";

describe("InfrastructureOverviewClient SecureNow grouped home sections", () => {
  it("renders Security, ARC-AMPE compliance, and Infrastructure sections on the Security home", () => {
    render(<InfrastructureOverviewClient secureNowHome />);

    expect(screen.getByTestId("governance-infrastructure-overview-page-title")).toHaveTextContent(
      OPERATOR_NAV_LINK_LABELS.home,
    );

    const groupedSections = screen.getByTestId("securenow-grouped-home-sections");
    const sectionTestIds = Array.from(groupedSections.children).map(
      (element) => (element as HTMLElement).dataset.testid,
    );

    expect(sectionTestIds).toEqual([
      "securenow-security-home-section",
      "securenow-compliance-home-section",
      "securenow-infrastructure-home-section",
    ]);
    expect(screen.getByTestId("securenow-compliance-home-section")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-infrastructure-home-section")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-security-home-section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURENOW_COMPLIANCE_HOME_SECTION_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SECURENOW_SECURITY_HOME_SECTION_HEADING })).toBeInTheDocument();
    expect(screen.getAllByText(/ARC-AMPE architecture themes/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId(`securenow-compliance-home-link-${GOVERNANCE_POLICY_PACKS_PATH}`)).toHaveAttribute(
      "href",
      GOVERNANCE_POLICY_PACKS_PATH,
    );
    expect(screen.getByTestId("securenow-infrastructure-home-link-/governance/infrastructure/resources")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources",
    );
    expect(screen.getByTestId("securenow-security-home-link-/integrations/cloud-connections")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
  });
});
