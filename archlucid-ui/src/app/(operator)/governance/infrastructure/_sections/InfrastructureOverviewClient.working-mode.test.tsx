import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/infrastructure",
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "archlucid" }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_WORKBENCHES_HEADING,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_OVERVIEW_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-evidence-copy";
import { InfrastructureOverviewClient } from "./InfrastructureOverviewClient";

describe("InfrastructureOverviewClient working mode", () => {
  it("renders skip link, claim discipline, and workbench table without buyer start-here panel", () => {
    render(<InfrastructureOverviewClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("governance-infrastructure-overview-claim-discipline")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_OVERVIEW_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("governance-infrastructure-overview-primary-content")).toHaveAttribute(
      "id",
      GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByRole("heading", { name: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_WORKBENCHES_HEADING })).toBeVisible();
    expect(screen.queryByTestId("governance-infrastructure-start-here-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("governance-infrastructure-overview-sources")).not.toBeInTheDocument();
  });
});
