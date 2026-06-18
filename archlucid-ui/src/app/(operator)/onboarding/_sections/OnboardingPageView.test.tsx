import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingPageView } from "./OnboardingPageView";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/OperatorPageContainer", () => ({
  OperatorPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/FinishSetupWizardPanel", () => ({
  FinishSetupWizardPanel: () => <div data-testid="finish-setup-wizard-panel-stub" />,
}));

vi.mock("@/components/TryCliDemoCard", () => ({
  TryCliDemoCard: () => <div data-testid="try-cli-demo-card-stub" />,
}));

vi.mock("@/components/GettingStartedTrialSection", () => ({
  GettingStartedTrialSection: () => <div data-testid="getting-started-trial-section-stub" />,
}));

vi.mock("@/components/FirstWeekRouteGuidance", () => ({
  FirstWeekRouteGuidance: () => <div data-testid="first-week-route-guidance-stub" />,
}));

vi.mock("@/components/InAppHelpLink", () => ({
  InAppHelpLink: ({ label }: { label: string }) => <span>{label}</span>,
}));

vi.mock("@/components/usability/CorePilotProgressTrackerBanner", () => ({
  CorePilotProgressTrackerBanner: () => <div data-testid="core-pilot-progress-tracker-banner-stub" />,
}));

vi.mock("@/components/usability/UnifiedFirstPilotProgressPanel", () => ({
  UnifiedFirstPilotProgressPanel: () => <div data-testid="unified-first-pilot-progress-panel-stub" />,
}));

describe("OnboardingPageView", () => {
  it("shows ROI baseline setup call-to-action", () => {
    render(<OnboardingPageView model={{ fromRegistration: false }} />);

    expect(screen.getByRole("heading", { name: "Configure ROI baseline" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure ROI baseline" })).toHaveAttribute("href", "/settings/baseline");
  });
});
