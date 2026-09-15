import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/infrastructure",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import { OPERATOR_SHORT_HELPER_MEASURE_CLASS } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_ACTION,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BODY,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { InfrastructureOverviewClient } from "./InfrastructureOverviewClient";

describe("InfrastructureOverviewClient buyer-polished chrome", () => {
  it("renders skip link, start-here panel, workbench table, and sources strip", () => {
    render(<InfrastructureOverviewClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("governance-infrastructure-overview-claim-discipline")).toBeInTheDocument();
    const startHerePanel = screen.getByTestId("governance-infrastructure-start-here-panel");
    const startHereBody = screen.getByText(GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BODY);

    expect(startHerePanel).toBeInTheDocument();
    expect(startHerePanel.className).not.toContain("max-w-2xl");
    expect(startHerePanel.className).not.toContain("max-w-prose");
    expect(startHerePanel.className).not.toContain("max-w-3xl");
    expect(startHereBody).toHaveClass(OPERATOR_SHORT_HELPER_MEASURE_CLASS);
    expect(startHereBody.className).not.toContain("max-w-2xl");
    expect(startHereBody.className).not.toContain("max-w-prose");
    expect(startHereBody.className).not.toContain("max-w-3xl");
    expect(screen.getByTestId("governance-infrastructure-overview-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-start-here-link")).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    );
    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_ACTION })).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
  });
});
