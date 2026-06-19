import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator-home/BuyerPolishedHomeHeroSection", () => ({
  BuyerPolishedHomeHeroSection: () => (
    <section data-testid="operator-home-hero-section">
      <div data-testid="home-block-pilot-command-center" />
    </section>
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredPanels", () => ({
  OperatorHomeDeltaPanel: () => <div data-testid="home-block-delta-panel" />,
  OperatorHomeRunsPanel: () => <div data-testid="home-block-runs-dashboard" />,
  OperatorHomeWorkspaceStatusPanel: () => <div data-testid="home-block-workspace-status" />,
}));

vi.mock("@/components/operator-home/OperatorHomeExampleRequestPanel", () => ({
  OperatorHomeExampleRequestPanel: () => <div data-testid="home-block-example-request" />,
}));

vi.mock("@/components/operator-home/OperatorHomeSampleReviewPreview", () => ({
  OperatorHomeSampleReviewPreview: () => <div data-testid="home-block-sample-review-preview" />,
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
  it("orders buyer-polished home as hero, first-value sample surfaces, reviews, then collapsed advanced guidance", () => {
    render(<OperatorHomePageView model={{ buyerPolishedShell: true }} />);

    expect(screen.getByTestId("operator-home-hero-section")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-example-request")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-sample-review-preview")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-advanced-guidance")).toBeInTheDocument();
    expect(screen.queryByTestId("home-block-workspace-status")).toBeNull();

    const heroSection = screen.getByTestId("operator-home-hero-section");
    const exampleRequest = screen.getByTestId("home-block-example-request");
    const sampleReviewPreview = screen.getByTestId("home-block-sample-review-preview");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const advancedGuidance = screen.getByTestId("home-block-advanced-guidance");

    expect(heroSection.compareDocumentPosition(exampleRequest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exampleRequest.compareDocumentPosition(sampleReviewPreview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sampleReviewPreview.compareDocumentPosition(runsDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(advancedGuidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps operator shell hero, first-value sample surfaces, reviews, and advanced guidance in order", () => {
    render(<OperatorHomePageView model={{ buyerPolishedShell: false }} />);

    expect(screen.getByTestId("home-block-pilot-command-center")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-example-request")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-sample-review-preview")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-advanced-guidance")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-workspace-status")).toBeInTheDocument();

    const hero = screen.getByTestId("home-block-pilot-command-center");
    const exampleRequest = screen.getByTestId("home-block-example-request");
    const sampleReviewPreview = screen.getByTestId("home-block-sample-review-preview");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const advancedGuidance = screen.getByTestId("home-block-advanced-guidance");
    const workspaceStatus = screen.getByTestId("home-block-workspace-status");

    expect(hero.compareDocumentPosition(exampleRequest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exampleRequest.compareDocumentPosition(sampleReviewPreview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sampleReviewPreview.compareDocumentPosition(runsDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(advancedGuidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(advancedGuidance.compareDocumentPosition(workspaceStatus) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
