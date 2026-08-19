import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpSponsorDashboardWorkspaceReadinessStrip", () => ({
  HelpSponsorDashboardWorkspaceReadinessStrip: () => (
    <div data-testid="help-sponsor-dashboard-workspace-readiness">
      <div data-testid="help-sponsor-dashboard-workspace-readiness-status">Baseline anchors set</div>
    </div>
  ),
}));

import { HelpSponsorDashboardGuideView } from "@/app/(operator)/help/_sections/HelpSponsorDashboardGuideView";
import {
  SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE,
  SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE_BUYER,
  SPONSOR_DASHBOARD_HELP_PRIMARY_CONTENT_ID,
  SPONSOR_DASHBOARD_HELP_SKIP_LINK_LABEL,
} from "@/lib/sponsor-dashboard-help-guide-content";
import { SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE } from "@/lib/sponsor-dashboard-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSponsorDashboardGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("sponsor-dashboard");

  it("renders skip link, buyer subtitle, orientation above overview, and hides registry provenance", () => {
    if (entry === undefined) {
      throw new Error("Expected sponsor-dashboard documentation entry.");
    }

    render(<HelpSponsorDashboardGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: SPONSOR_DASHBOARD_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SPONSOR_DASHBOARD_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-sponsor-dashboard-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("help-sponsor-dashboard-claim-discipline").textContent).toContain(
      SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const orientationTop = screen.getByTestId("help-sponsor-dashboard-orientation-top");
    const overview = screen.getByTestId("help-sponsor-dashboard-overview");

    expect(orientationTop.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
