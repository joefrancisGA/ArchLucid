import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WelcomeBanner", () => ({
  WelcomeBanner: () => <div data-testid="home-block-welcome" />,
}));

vi.mock("@/components/SampleFirstReviewPackageCard", () => ({
  SampleFirstReviewPackageCard: () => <div data-testid="home-block-sample-package" />,
}));

vi.mock("@/components/CorePilotBuyerStepHint", () => ({
  CorePilotBuyerStepHint: () => <div data-testid="home-block-buyer-step-hint" />,
}));

vi.mock("@/components/operator-home/RunsDashboardPanel", () => ({
  RunsDashboardPanel: () => <div data-testid="home-block-runs-dashboard" />,
}));

vi.mock("@/components/BeforeAfterDeltaPanel", () => ({
  BeforeAfterDeltaPanel: () => <div data-testid="home-block-before-after" />,
}));

vi.mock("@/components/BuyerGoldenJourneyStrip", () => ({
  BuyerGoldenJourneyStrip: () => <div data-testid="home-block-journey" />,
}));

vi.mock("@/components/FirstPilotOperatingRail", () => ({
  FirstPilotOperatingRail: () => <div data-testid="home-block-operating-rail" />,
}));

vi.mock("@/components/LlmUsageBandHint", () => ({
  LlmUsageBandHint: () => <div data-testid="home-block-llm-hint" />,
}));

vi.mock("@/components/OperatorCoArchitectHomeStrip", () => ({
  OperatorCoArchitectHomeStrip: () => <div data-testid="home-block-co-architect" />,
}));

vi.mock("@/components/FirstPilotReadinessCockpit", () => ({
  FirstPilotReadinessCockpit: () => <div data-testid="home-block-readiness-cockpit" />,
}));

vi.mock("@/components/FirstWeekRouteGuidance", () => ({
  FirstWeekRouteGuidance: () => <div data-testid="home-block-first-week" />,
}));

vi.mock("@/components/CorePilotNextStepsCard", () => ({
  CorePilotNextStepsCard: () => <div data-testid="home-block-next-steps" />,
}));

vi.mock("@/components/CorePilotChecklist", () => ({
  CorePilotChecklist: () => <div data-testid="home-block-checklist" />,
}));

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

function sectionBlockOrder(sectionTestId: string): string[] {
  const section = screen.getByTestId(sectionTestId);

  return Array.from(section.querySelectorAll("[data-testid^='home-block-']")).map(
    (element) => element.getAttribute("data-testid") ?? "",
  );
}

describe("OperatorHomePageView", () => {
  it("orders buyer-polished home as proof, journey, then setup workflow", () => {
    render(<OperatorHomePageView model={{ buyerPolishedShell: true }} />);

    expect(screen.getByTestId("operator-home-proof-section")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-journey-section")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-setup-section")).toBeInTheDocument();

    expect(sectionBlockOrder("operator-home-proof-section")).toEqual([
      "home-block-sample-package",
      "home-block-runs-dashboard",
      "home-block-before-after",
    ]);
    expect(sectionBlockOrder("operator-home-journey-section")).toEqual(["home-block-journey"]);
    expect(sectionBlockOrder("operator-home-setup-section")).toEqual([
      "home-block-buyer-step-hint",
      "home-block-welcome",
      "home-block-operating-rail",
      "home-block-llm-hint",
    ]);

    const proofSection = screen.getByTestId("operator-home-proof-section");
    const journeySection = screen.getByTestId("operator-home-journey-section");
    const setupSection = screen.getByTestId("operator-home-setup-section");

    expect(proofSection.compareDocumentPosition(journeySection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(journeySection.compareDocumentPosition(setupSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps operator shell proof before reviews grid and setup rail at the bottom", () => {
    render(<OperatorHomePageView model={{ buyerPolishedShell: false }} />);

    expect(screen.queryByTestId("operator-home-proof-section")).toBeNull();
    expect(screen.getByTestId("home-block-co-architect")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-readiness-cockpit")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();

    const samplePackage = screen.getByTestId("home-block-sample-package");
    const operatingRail = screen.getByTestId("home-block-operating-rail");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const nextSteps = screen.getByTestId("home-block-next-steps");

    expect(samplePackage.compareDocumentPosition(operatingRail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(operatingRail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(nextSteps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
