import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator-home/BuyerPolishedHomeHeroSection", () => ({
  BuyerPolishedHomeHeroSection: () => (
    <section data-testid="operator-home-hero-section">
      <div data-testid="home-block-pilot-command-center" />
    </section>
  ),
}));

vi.mock("@/components/operator-home/RunsDashboardPanel", () => ({
  RunsDashboardPanel: () => <div data-testid="home-block-runs-dashboard" />,
}));

vi.mock("@/components/operator-home/OperatorHomeAdvancedGuidanceSection", () => ({
  OperatorHomeAdvancedGuidanceSection: () => <div data-testid="home-block-advanced-guidance" />,
}));

vi.mock("@/components/operator-home/OperatorHomeWorkspaceStatusSection", () => ({
  OperatorHomeWorkspaceStatusSection: () => <div data-testid="home-block-workspace-status" />,
}));

vi.mock("@/components/usability/PilotCommandCenterCard", () => ({
  PilotCommandCenterCard: () => <div data-testid="home-block-pilot-command-center" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: vi.fn(() => true),
  };
});

vi.mock("@/components/OperatorHomeGate", () => ({
  OperatorHomeGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/TrialWelcomeRunDeepLink", () => ({
  TrialWelcomeRunDeepLink: () => null,
}));

vi.mock("@/components/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

import { OperatorHomePageView } from "./OperatorHomePageView";

describe("OperatorHomePageView", () => {
  it("orders buyer-polished home as hero, reviews, then collapsed advanced guidance", () => {
    render(<OperatorHomePageView model={{ buyerPolishedShell: true }} />);

    expect(screen.getByTestId("operator-home-hero-section")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-advanced-guidance")).toBeInTheDocument();
    expect(screen.queryByTestId("home-block-workspace-status")).toBeNull();

    const heroSection = screen.getByTestId("operator-home-hero-section");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const advancedGuidance = screen.getByTestId("home-block-advanced-guidance");

    expect(heroSection.compareDocumentPosition(runsDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(advancedGuidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps operator shell hero before reviews and advanced guidance at the bottom", () => {
    render(<OperatorHomePageView model={{ buyerPolishedShell: false }} />);

    expect(screen.getByTestId("home-block-pilot-command-center")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-advanced-guidance")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-workspace-status")).toBeInTheDocument();

    const hero = screen.getByTestId("home-block-pilot-command-center");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const advancedGuidance = screen.getByTestId("home-block-advanced-guidance");
    const workspaceStatus = screen.getByTestId("home-block-workspace-status");

    expect(hero.compareDocumentPosition(runsDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(advancedGuidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(advancedGuidance.compareDocumentPosition(workspaceStatus) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
