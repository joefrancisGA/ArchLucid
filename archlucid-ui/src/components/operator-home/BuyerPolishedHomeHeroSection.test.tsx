import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Hero uses PilotCommandCenterCardDeferred (TB-2145), not the leaf module.
vi.mock("@/app/(operator)/_sections/operator-home-page-view-deferred-chunks", () => ({
  PilotCommandCenterCardDeferred: () => <div data-testid="home-block-pilot-command-center" />,
}));

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { BuyerPolishedHomeHeroSection } from "@/components/operator-home/BuyerPolishedHomeHeroSection";

const emptyRunsDashboard: OperatorHomeRunsDashboardModel = {
  projectId: "default",
  page: 1,
  pageSize: 5,
  items: [],
  totalCount: 0,
  loadFailure: null,
  malformedMessage: null,
  usedStaticRunsFallback: false,
  buyerPolishedShell: true,
};

describe("BuyerPolishedHomeHeroSection", () => {
  it("renders only the compact pilot command center hero", () => {
    render(<BuyerPolishedHomeHeroSection runsDashboard={emptyRunsDashboard} />);

    expect(screen.getByTestId("operator-home-hero-section")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-pilot-command-center")).toBeInTheDocument();
    expect(screen.queryByTestId("buyer-home-secondary-panels")).toBeNull();
  });
});
