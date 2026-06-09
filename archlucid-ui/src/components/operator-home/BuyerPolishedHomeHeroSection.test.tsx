import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator-home/BuyerCtoDemoReadinessPanel", () => ({
  BuyerCtoDemoReadinessPanel: () => <div data-testid="home-block-cto-demo-readiness" />,
}));

vi.mock("@/components/operator-home/StartCtoDemoCard", () => ({
  StartCtoDemoCard: () => <div data-testid="home-block-start-cto-demo" />,
}));

vi.mock("@/components/FirstValueReachedCallout", () => ({
  FirstValueReachedCallout: () => <div data-testid="home-block-first-value" />,
}));

vi.mock("@/components/WelcomeBanner", () => ({
  WelcomeBanner: () => <div data-testid="home-block-welcome" />,
}));

vi.mock("@/components/CorePilotBuyerStepHint", () => ({
  CorePilotBuyerStepHint: () => <div data-testid="home-block-core-pilot-hint" />,
}));

vi.mock("@/components/BeforeAfterDeltaPanel", () => ({
  BeforeAfterDeltaPanel: () => <div data-testid="home-block-before-after" />,
}));

vi.mock("@/components/OperatorCoArchitectHomeStrip", () => ({
  OperatorCoArchitectHomeStrip: () => <div data-testid="home-block-co-architect" />,
}));

vi.mock("@/components/SampleFirstReviewPackageCard", () => ({
  SampleFirstReviewPackageCard: () => <div data-testid="home-block-sample-package" />,
}));

vi.mock("@/components/operator-home/SamplePackageShortcutsCard", () => ({
  SamplePackageShortcutsCard: () => <div data-testid="home-block-shortcuts" />,
}));

vi.mock("@/lib/buyer-cto-demo-tour", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/buyer-cto-demo-tour")>();

  return {
    ...actual,
    readBuyerCtoDemoTourActive: vi.fn(() => false),
  };
});

import { readBuyerCtoDemoTourActive } from "@/lib/buyer-cto-demo-tour";
import { BuyerPolishedHomeHeroSection } from "@/components/operator-home/BuyerPolishedHomeHeroSection";

describe("BuyerPolishedHomeHeroSection", () => {
  it("shows secondary onboarding panels when the tour is inactive", () => {
    render(<BuyerPolishedHomeHeroSection />);

    expect(screen.getByTestId("buyer-home-secondary-panels")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-welcome")).toBeInTheDocument();
  });

  it("hides secondary onboarding panels when the tour is active", () => {
    vi.mocked(readBuyerCtoDemoTourActive).mockReturnValueOnce(true);

    render(<BuyerPolishedHomeHeroSection />);

    expect(screen.queryByTestId("buyer-home-secondary-panels")).toBeNull();
    expect(screen.getByTestId("home-block-start-cto-demo")).toBeInTheDocument();
  });
});
